import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DashboardCockpit } from './components/DashboardCockpit';
import { SipShieldTab } from './components/SipShieldTab';
import { CelebrationsTab } from './components/CelebrationsTab';
import { MutualFundsWorkspace } from './components/MutualFundsWorkspace';
import { NewLeadsProspectsManager } from './components/NewLeadsProspectsManager';
import { ProtectionVault } from './components/ProtectionVault';
import { ClientMasterWorkspace } from './components/ClientMasterWorkspace';
import { HomeLoanAcquisitionView } from './components/HomeLoanAcquisitionView';
import { ContentStudioView } from './components/ContentStudioView';
import { GlobalSearch } from './components/GlobalSearch';
import { SettingsModal } from './components/SettingsModal';
import { UploadPolicyModal } from './components/UploadPolicyModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { InstallPrompt } from './components/InstallPrompt';

import { localDb } from './lib/indexedDB';
import { getSupabase } from './lib/supabase';
import { calculateShieldAlerts } from './lib/sipShieldEngine';
import { getCelebrationAlerts } from './lib/celebrationEngine';
import { syncPolicyMembersToClientMaster } from './lib/insuranceClientSync';
import { isSamePersonOrEntity } from './lib/entityResolution';
import { SYNTHETIC_INSURANCE_POLICIES } from './data/syntheticInsuranceFixtures';
import { DEFAULT_INSURERS, InsurerRecord } from './data/insurerRegistry';
import seedData from './data/seedData.json';
import {
  Client,
  ClientMasterRecord,
  ClientImportBatch,
  AmbiguousClientMatch,
  ClientChangeLog,
  MfHolding,
  ActiveSip,
  Lead,
  ProtectionAsset,
  ImportBatch,
  InsurancePolicy
} from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('cockpit');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);

  // Core CRM Datasets initialized directly from authoritative seed
  const [clients, setClients] = useState<Client[]>(() => (seedData.clients || []) as Client[]);
  const [clientMaster, setClientMaster] = useState<ClientMasterRecord[]>(() => (seedData.client_master || []) as ClientMasterRecord[]);
  const [clientImportHistory, setClientImportHistory] = useState<ClientImportBatch[]>([]);
  const [clientReviewQueue, setClientReviewQueue] = useState<AmbiguousClientMatch[]>([]);
  const [clientChangeLogs, setClientChangeLogs] = useState<ClientChangeLog[]>([]);

  const [holdings, setHoldings] = useState<MfHolding[]>(() => (seedData.holdings || []) as MfHolding[]);
  const [sips, setSips] = useState<ActiveSip[]>(() => (seedData.sips || []) as ActiveSip[]);
  const [batches, setBatches] = useState<ImportBatch[]>([]);
  const [leads, setLeads] = useState<Lead[]>(() => (seedData.leads || []) as Lead[]);
  const [policies, setPolicies] = useState<ProtectionAsset[]>(() => ((seedData as any).policies || []) as ProtectionAsset[]);
  const [insurancePolicies, setInsurancePolicies] = useState<InsurancePolicy[]>(() => SYNTHETIC_INSURANCE_POLICIES);
  const [insurers, setInsurers] = useState<InsurerRecord[]>(DEFAULT_INSURERS);
  const [dispatchedKeys, setDispatchedKeys] = useState<Set<string>>(new Set());

  // Date Simulation for Testing Shields
  const [simulatedDate, setSimulatedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  // Modal Controls
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUploadPolicyOpen, setIsUploadPolicyOpen] = useState(false);

  // Network Listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initialize Data from IndexedDB with full resilience
  const loadData = async () => {
    try {
      await localDb.init();

      // 1. Authoritative Client Master
      let cm: ClientMasterRecord[] = [];
      try {
        cm = await localDb.getAll<ClientMasterRecord>('client_master');
      } catch (e) {
        console.warn('Could not read client_master from IDB', e);
      }

      let masterRecords = cm;
      if (masterRecords.length < 100) {
        if (seedData.client_master && seedData.client_master.length > 0) {
          masterRecords = seedData.client_master as ClientMasterRecord[];
          try {
            await localDb.clear('client_master');
            await localDb.putMany('client_master', masterRecords);
          } catch {}
        }
      }

      let c: Client[] = [];
      try {
        c = await localDb.getAll<Client>('clients');
      } catch (e) {
        console.warn('Could not read clients from IDB', e);
      }

      let clientRecords = c;
      if (clientRecords.length < 100 && seedData.clients && seedData.clients.length > 0) {
        clientRecords = seedData.clients as Client[];
        try {
          await localDb.clear('clients');
          await localDb.putMany('clients', clientRecords);
        } catch {}
      }
      setClients(clientRecords);

      // 2. Verified Insurer Registry
      let savedInsurers = DEFAULT_INSURERS;
      try {
        const fromDb = await localDb.getAll<InsurerRecord>('insurer_registry');
        if (fromDb && fromDb.length > 0) {
          savedInsurers = fromDb;
        } else {
          const fromLs = localStorage.getItem('antfinserv_insurer_registry');
          if (fromLs) {
            savedInsurers = JSON.parse(fromLs);
          } else {
            await localDb.putMany('insurer_registry', DEFAULT_INSURERS);
          }
        }
      } catch (e) {
        console.warn('Using default insurers', e);
      }
      setInsurers(savedInsurers);

      // 3. Clean dummy leads & load leads
      const dummyIds = ['lead_rai_sahib', 'lead_arpit_arora'];
      for (const did of dummyIds) {
        try { await localDb.delete('leads', did); } catch {}
      }
      let l: Lead[] = [];
      try {
        l = await localDb.getAll<Lead>('leads');
      } catch {}
      let currentLeads = l.filter(lead => !dummyIds.includes(lead.id));
      if (currentLeads.length === 0 && seedData.leads && seedData.leads.length > 0) {
        currentLeads = seedData.leads as Lead[];
        try { await localDb.putMany('leads', currentLeads); } catch {}
      }
      const hasAnhad = currentLeads.some(lead => lead.owner_name?.toLowerCase().includes('anhad'));
      if (!hasAnhad) {
        const anhadLead: Lead = {
          id: 'lead_anhad_makkar',
          firm_name: 'Makkar Enterprises / Family Wealth',
          owner_name: 'Anhad Makkar',
          mobile: '9811000000',
          status: 'Warm Lead',
          lead_source: 'Mobile Cockpit CRM Sync',
          notes: 'Synchronized from Mobile App. Mutual fund SIP & wealth portfolio review.',
          created_at: new Date().toISOString()
        };
        try { await localDb.put('leads', anhadLead); } catch {}
        currentLeads = [anhadLead, ...currentLeads];
      }
      setLeads(currentLeads);

      // 4. Active SIPs (156 active mandates)
      let s: ActiveSip[] = [];
      try {
        s = await localDb.getAll<ActiveSip>('sips');
      } catch {}
      let currentSips = s;
      if (currentSips.length < 156 && seedData.sips && seedData.sips.length > 0) {
        currentSips = seedData.sips as ActiveSip[];
        try {
          await localDb.clear('sips');
          await localDb.putMany('sips', currentSips);
        } catch {}
      }
      setSips(currentSips);

      // 5. Authoritative Holdings (323 folio holdings totaling ₹7.91 Cr AUM)
      let h: MfHolding[] = [];
      try {
        h = await localDb.getAll<MfHolding>('holdings');
      } catch {}
      let currentHoldings = h;
      if (currentHoldings.length < 320 && seedData.holdings && seedData.holdings.length > 0) {
        currentHoldings = seedData.holdings as MfHolding[];
        try {
          await localDb.clear('holdings');
          await localDb.putMany('holdings', currentHoldings);
        } catch {}
      }
      setHoldings(currentHoldings);

      // 6. Insurance Policies & Family Synchronization
      let currentInsurance: InsurancePolicy[] = [];
      try {
        currentInsurance = await localDb.getAll<InsurancePolicy>('insurance_policies');
      } catch {}
      const hasClearedDemo = localStorage.getItem('antos_demo_policies_cleared') === 'true';
      if (currentInsurance.length === 0 && !hasClearedDemo) {
        currentInsurance = SYNTHETIC_INSURANCE_POLICIES;
        try { await localDb.putMany('insurance_policies', currentInsurance); } catch {}
      } else if (!hasClearedDemo) {
        const existingIds = new Set(currentInsurance.map(p => p.id));
        const missing = SYNTHETIC_INSURANCE_POLICIES.filter(p => !existingIds.has(p.id));
        if (missing.length > 0) {
          currentInsurance = [...currentInsurance, ...missing];
          try { await localDb.putMany('insurance_policies', missing); } catch {}
        }
      }

      currentInsurance = currentInsurance.map(p => {
        let modified = false;
        let updated = { ...p };
        if ((p.vertical === 'HEALTH' || p.vertical === 'LIFE') && p.taxes_gst > 0) {
          updated.taxes_gst = 0;
          updated.gross_premium = updated.net_premium;
          modified = true;
        }
        if (p.vertical === 'HEALTH' && p.vertical_data && !p.vertical_data.ncb_current_year_amount && p.vertical_data.cumulative_bonus_percentage) {
          updated.vertical_data = {
            ...p.vertical_data,
            ncb_current_year_amount: Math.round((p.sum_insured * (p.vertical_data.cumulative_bonus_percentage || 0)) / 100)
          };
          modified = true;
        }
        if (modified) {
          try { localDb.put('insurance_policies', updated); } catch {}
        }
        return updated;
      });
      setInsurancePolicies(currentInsurance);

      // Automatically synchronize health policy covered members (spouse, children, parents) into ClientMasterRecord
      let updatedMaster = [...masterRecords];
      const hasSwaminathan = updatedMaster.some(c => c.pan === 'ADLPA7633H' || c.investor_name.includes('SWAMINATHAN'));
      if (!hasSwaminathan) {
        const swamiClient: ClientMasterRecord = {
          client_id: 'cli_swaminathan_arunachalam',
          investor_name: 'SWAMINATHAN ARUNACHALAM',
          pan: 'ADLPA7633H',
          dob: '1974-12-18',
          gender: 'Male',
          mobile: '9888732823',
          email: 'tarunahuja@pbpartners.com',
          address_line_1: 'Flat No 1302 Tower E Oberoi Splendor Complex, JVLR Andheri East',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400060',
          aum: 0,
          mapping_role: 'Individual',
          source_system: 'INSURANCE',
          created_date: '2026-08-20',
          data_quality_flags: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        updatedMaster = [swamiClient, ...updatedMaster];
        try { await localDb.put('client_master', swamiClient); } catch {}
      }

      for (const pol of currentInsurance) {
        const syncRes = syncPolicyMembersToClientMaster(pol, updatedMaster);
        if (syncRes.newMembersAdded.length > 0) {
          updatedMaster = syncRes.updatedClients;
          try { await localDb.putMany('client_master', syncRes.newMembersAdded); } catch {}
        }
      }

      masterRecords = updatedMaster;
      setClientMaster(masterRecords);

      try {
        const imph = await localDb.getAll<ClientImportBatch>('client_import_history');
        setClientImportHistory(imph.sort((a, b) => new Date(b.imported_at).getTime() - new Date(a.imported_at).getTime()));
      } catch {}

      try {
        const revq = await localDb.getAll<AmbiguousClientMatch>('client_review_queue');
        setClientReviewQueue(revq.filter(q => q.status === 'PENDING'));
      } catch {}

      try {
        const logs = await localDb.getAll<ClientChangeLog>('client_audit_history');
        setClientChangeLogs(logs.sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime()));
      } catch {}

      try {
        const b = await localDb.getAll<ImportBatch>('batches');
        setBatches(b);
      } catch {}

      try {
        const p = await localDb.getAll<ProtectionAsset>('policies');
        setPolicies(p);
      } catch {}

    } catch (err) {
      console.error('Failed to load IndexedDB data', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Computed Authoritative Metrics
  const totalHoldingAum = holdings.reduce((sum, h) => sum + (h.current_value || 0), 0);
  const totalMonthlySipCommitment = sips.reduce((sum, s) => sum + (s.monthly_amount || 0), 0);

  // 4-Day SIP Shield Calculations (Works seamlessly with ActiveSip records!)
  const shieldAlerts = calculateShieldAlerts(
    sips,
    new Date(simulatedDate),
    dispatchedKeys
  );

  // Celebrations sourced from authoritative Client Master DOBs
  const celebrationAlerts = getCelebrationAlerts(
    clientMaster.length > 0 ? clientMaster : clients,
    policies,
    new Date(simulatedDate)
  );
  const todayCelebrations = celebrationAlerts.filter(c => c.is_today);

  // Toggle Dispatched in SIP Shield
  const handleToggleDispatched = (key: string) => {
    setDispatchedKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Holding Import Handler (Portfolio Refresh logic)
  const handleSaveHoldings = async (newHoldings: MfHolding[], batch: ImportBatch) => {
    await localDb.putMany('holdings', newHoldings);
    await localDb.put('batches', batch);

    // Auto-discover unique clients from holdings and add to clientMaster
    const discoveredClients: ClientMasterRecord[] = [];
    const clientPanMap = new Set(clientMaster.map(c => c.pan).filter(Boolean));

    newHoldings.forEach(h => {
      if (h.pan && h.pan !== 'PAN_NOT_PROVIDED' && !clientPanMap.has(h.pan)) {
        clientPanMap.add(h.pan);
        discoveredClients.push({
          client_id: `antos_cli_mf_${Date.now()}_${discoveredClients.length}`,
          source_system: 'MFBOX',
          pan: h.pan,
          investor_name: h.investor_name,
          dob: null,
          gender: 'Not Specified',
          mobile: '',
          email: '',
          mapping_role: 'Individual',
          aum: h.current_value,
          rm_name: h.rm_name,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          data_quality_flags: ['MISSING_DOB', 'MISSING_MOBILE']
        });
      }
    });

    if (discoveredClients.length > 0) {
      await localDb.putMany('client_master', discoveredClients);
      setClientMaster(prev => [...prev, ...discoveredClients]);
    }

    setHoldings(prev => {
      const map = new Map<string, MfHolding>();
      prev.forEach(h => map.set(h.id, h));
      newHoldings.forEach(h => map.set(h.id, h));
      return Array.from(map.values());
    });
    setBatches(prev => [batch, ...prev.filter(b => b.id !== batch.id)]);
    const totalAumVal = newHoldings.reduce((sum, h) => sum + (h.current_value || 0), 0);
    alert(`Successfully imported ${newHoldings.length} holdings from ${batch.file_name}!\nAuthoritative Portfolio AUM: ₹${totalAumVal.toLocaleString('en-IN')}`);
  };

  // Active SIP Import Handler (Preserving multiple SIP mandates per folio/scheme!)
  const handleSaveSips = async (newSips: ActiveSip[], batch: ImportBatch) => {
    await localDb.putMany('sips', newSips);
    await localDb.put('batches', batch);

    // Auto-update mobile contacts on clients if missing
    newSips.forEach(s => {
      if (s.mobile && s.pan_number) {
        const cl = clientMaster.find(c => c.pan === s.pan_number);
        if (cl && !cl.mobile) {
          cl.mobile = s.mobile;
          localDb.put('client_master', cl);
        }
      }
    });

    setSips(prev => {
      const map = new Map<string, ActiveSip>();
      prev.forEach(s => map.set(s.id, s));
      newSips.forEach(s => map.set(s.id, s));
      return Array.from(map.values());
    });
    setBatches(prev => [batch, ...prev.filter(b => b.id !== batch.id)]);
    const totalSipVal = newSips.reduce((sum, s) => sum + (s.monthly_amount || 0), 0);
    alert(`Successfully imported ${newSips.length} active SIP mandates from ${batch.file_name}!\nMonthly Active SIP Commitment: ₹${totalSipVal.toLocaleString('en-IN')}/mo`);
  };

  // Save Policy to Vault & Synchronize Family Members
  const handleSavePolicy = async (savedItem: ProtectionAsset | InsurancePolicy) => {
    if ('vertical' in savedItem && 'members' in savedItem) {
      const modernPolicy = savedItem as InsurancePolicy;
      await localDb.put('insurance_policies', modernPolicy);

      // Create legacy ProtectionAsset representation for backward compatibility
      const legacyAsset: ProtectionAsset = {
        id: modernPolicy.id,
        policy_number: modernPolicy.policy_number,
        client_name: modernPolicy.client_name,
        insurer: modernPolicy.insurer_name,
        policy_type:
          modernPolicy.vertical === 'HEALTH'
            ? (modernPolicy.members.length > 1 ? 'Health (Family Floater)' : 'Individual Health')
            : modernPolicy.vertical === 'MOTOR'
            ? 'Motor'
            : 'Term',
        net_premium: modernPolicy.net_premium,
        sum_insured: modernPolicy.sum_insured,
        expiry_date: modernPolicy.expiry_date,
        days_to_expiry: Math.ceil((new Date(modernPolicy.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
        primary_member_name: modernPolicy.proposer_name || modernPolicy.client_name,
        primary_member_dob: modernPolicy.members.find(m => m.is_primary_insured)?.dob || null,
        dep1_name: modernPolicy.members.filter(m => !m.is_primary_insured)[0]?.member_name,
        dep1_relation: modernPolicy.members.filter(m => !m.is_primary_insured)[0]?.relationship_to_head,
        dep1_dob: modernPolicy.members.filter(m => !m.is_primary_insured)[0]?.dob,
        dep2_name: modernPolicy.members.filter(m => !m.is_primary_insured)[1]?.member_name,
        dep2_relation: modernPolicy.members.filter(m => !m.is_primary_insured)[1]?.relationship_to_head,
        dep2_dob: modernPolicy.members.filter(m => !m.is_primary_insured)[1]?.dob,
        document_name: modernPolicy.source_document_name || 'Policy Document',
        created_at: modernPolicy.created_at
      };
      await localDb.put('policies', legacyAsset);

      setInsurancePolicies(prev => [modernPolicy, ...prev.filter(p => p.policy_number !== modernPolicy.policy_number)]);
      setPolicies(prev => [legacyAsset, ...prev.filter(p => p.policy_number !== legacyAsset.policy_number)]);

      // Auto-sync family members to Client Master for Birthday & Content Studio wishes
      const syncRes = syncPolicyMembersToClientMaster(modernPolicy, clientMaster);
      if (syncRes.newMembersAdded.length > 0) {
        await localDb.putMany('client_master', syncRes.newMembersAdded);
        setClientMaster(syncRes.updatedClients);
      }

      alert(
        `Policy ${modernPolicy.policy_number} for ${modernPolicy.client_name} saved successfully!\n` +
        (syncRes.newMembersAdded.length > 0
          ? `${syncRes.newMembersAdded.length} Covered Family Member(s) synced to Client Master for Birthday Wishes & Content Studio.`
          : 'All family members are already synchronized in Client Master.')
      );
    } else {
      const legacy = savedItem as ProtectionAsset;
      await localDb.put('policies', legacy);
      setPolicies(prev => [legacy, ...prev.filter(p => p.policy_number !== legacy.policy_number)]);
      alert(`Policy ${legacy.policy_number} for ${legacy.client_name} saved successfully!`);
    }
  };

  // Client Master Handlers
  const handleCommitClientImport = async (
    newClients: ClientMasterRecord[],
    updatedClients: ClientMasterRecord[],
    batch: ClientImportBatch,
    ambiguous: AmbiguousClientMatch[],
    logs: ClientChangeLog[]
  ) => {
    const toSave = [...newClients, ...updatedClients];
    await localDb.putMany('client_master', toSave);
    await localDb.put('client_import_history', batch);
    if (ambiguous.length > 0) await localDb.putMany('client_review_queue', ambiguous);
    if (logs.length > 0) await localDb.putMany('client_audit_history', logs);

    setClientMaster(prev => {
      const map = new Map<string, ClientMasterRecord>();
      prev.forEach(c => map.set(c.client_id, c));
      toSave.forEach(c => map.set(c.client_id, c));
      return Array.from(map.values());
    });
    setClientImportHistory(prev => [batch, ...prev]);
    if (ambiguous.length > 0) setClientReviewQueue(prev => [...prev, ...ambiguous]);
    if (logs.length > 0) setClientChangeLogs(prev => [...logs, ...prev]);

    alert(`Client Master import committed successfully!\n${newClients.length} New Clients added, ${updatedClients.length} Profiles updated.`);
  };

  const handleSaveClientManualEdit = async (updatedClient: ClientMasterRecord) => {
    const log: ClientChangeLog = {
      id: `chg_manual_${Date.now()}`,
      client_id: updatedClient.client_id,
      field: 'MANUAL_PROFILE_UPDATE',
      old_value: 'PROFILE',
      new_value: 'UPDATED',
      changed_at: new Date().toISOString(),
      changed_by: 'ADVISOR',
      source: 'MANUAL'
    };
    await localDb.put('client_master', updatedClient);
    await localDb.put('client_audit_history', log);

    setClientMaster(prev => prev.map(c => c.client_id === updatedClient.client_id ? updatedClient : c));
    setClientChangeLogs(prev => [log, ...prev]);
  };

  const handleResolveReview = async (
    matchId: string,
    resolution: 'MERGE' | 'CREATE_AS_NEW',
    targetClientId?: string
  ) => {
    const item = clientReviewQueue.find(q => q.id === matchId);
    if (!item) return;

    if (resolution === 'MERGE' && targetClientId) {
      const existing = clientMaster.find(c => c.client_id === targetClientId);
      if (existing) {
        const merged: ClientMasterRecord = {
          ...existing,
          pan: existing.pan || item.incoming_record.pan || null,
          mobile: existing.mobile || item.incoming_record.mobile || '',
          email: existing.email || item.incoming_record.email || '',
          dob: existing.dob || item.incoming_record.dob || null,
          updated_at: new Date().toISOString()
        };
        await localDb.put('client_master', merged);
        setClientMaster(prev => prev.map(c => c.client_id === targetClientId ? merged : c));
      }
    } else {
      const newRecord: ClientMasterRecord = {
        client_id: `antos_cli_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        source_system: 'MFBOX',
        mapping_role: item.incoming_record.mapping_role || 'Individual',
        pan: item.incoming_record.pan || null,
        investor_name: item.incoming_record.investor_name || 'Unknown',
        dob: item.incoming_record.dob || null,
        gender: item.incoming_record.gender || 'Not Specified',
        mobile: item.incoming_record.mobile || '',
        email: item.incoming_record.email || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        data_quality_flags: item.incoming_record.data_quality_flags || []
      };
      await localDb.put('client_master', newRecord);
      setClientMaster(prev => [...prev, newRecord]);
    }

    await localDb.delete('client_review_queue', matchId);
    setClientReviewQueue(prev => prev.filter(q => q.id !== matchId));
  };

  // Delete Insurance Policy Handler
  const handleDeleteInsurancePolicy = async (policyId: string) => {
    const target = insurancePolicies.find(p => p.id === policyId);
    await localDb.delete('insurance_policies', policyId);
    if (target?.policy_number) {
      await localDb.delete('policies', target.policy_number);
    }
    setInsurancePolicies(prev => prev.filter(p => p.id !== policyId));
    setPolicies(prev => prev.filter(p => p.id !== policyId && (!target?.policy_number || p.policy_number !== target.policy_number)));
  };

  // Clear Synthetic Demo Policies Handler
  const handleClearDemoPolicies = async () => {
    // Keep authentic policies (Niva Bupa, SBI General) and any user uploaded policies
    const authenticNumbers = ['34154365202602', 'POPMCAR00102986126'];
    const demoPolicies = insurancePolicies.filter(p => !authenticNumbers.includes(p.policy_number));
    for (const demo of demoPolicies) {
      await localDb.delete('insurance_policies', demo.id);
      if (demo.policy_number) {
        await localDb.delete('policies', demo.policy_number);
      }
    }
    localStorage.setItem('antos_demo_policies_cleared', 'true');
    const remaining = insurancePolicies.filter(p => authenticNumbers.includes(p.policy_number));
    setInsurancePolicies(remaining);
    setPolicies(prev => prev.filter(p => authenticNumbers.includes(p.policy_number)));
    alert(`Demo policies cleared successfully! Kept ${remaining.length} authentic policy record(s).`);
  };

  // Delete Client Handler
  const handleDeleteClient = async (clientId: string) => {
    await localDb.delete('client_master', clientId);
    await localDb.delete('clients', clientId);
    setClientMaster(prev => prev.filter(c => c.client_id !== clientId));
    setClients(prev => prev.filter(c => (c.client_id || (c as any).id) !== clientId));
  };

  // Bulk Delete Clients Handler
  const handleBulkDeleteClients = async (clientIds: string[]) => {
    for (const cid of clientIds) {
      await localDb.delete('client_master', cid);
      await localDb.delete('clients', cid);
    }
    const idSet = new Set(clientIds);
    setClientMaster(prev => prev.filter(c => !idSet.has(c.client_id)));
    setClients(prev => prev.filter(c => !idSet.has(c.client_id || (c as any).id)));
  };

  // Bulk Delete Policies Handler
  const handleBulkDeletePolicies = async (policyIds: string[]) => {
    const targetPolicies = insurancePolicies.filter(p => policyIds.includes(p.id));
    for (const pid of policyIds) {
      await localDb.delete('insurance_policies', pid);
    }
    for (const p of targetPolicies) {
      if (p.policy_number) {
        await localDb.delete('policies', p.policy_number);
      }
    }
    const idSet = new Set(policyIds);
    setInsurancePolicies(prev => prev.filter(p => !idSet.has(p.id)));
    setPolicies(prev => prev.filter(p => !idSet.has(p.id) && !targetPolicies.some(tp => tp.policy_number === p.policy_number)));
  };

  // Update Holding & Auto-Recalculate Client AUM
  const handleUpdateHolding = async (updatedHolding: MfHolding) => {
    await localDb.put('holdings', updatedHolding);
    const nextHoldings = holdings.map(h => h.id === updatedHolding.id ? updatedHolding : h);
    setHoldings(nextHoldings);

    // Auto-recalculate client AUM across client_master & clients
    const matchedClient = clientMaster.find(c =>
      (c.pan && c.pan === updatedHolding.pan) ||
      (c.investor_name && c.investor_name.toLowerCase() === updatedHolding.investor_name.toLowerCase())
    );
    if (matchedClient) {
      const clientAllHoldings = nextHoldings.filter(h =>
        (matchedClient.pan && h.pan === matchedClient.pan) ||
        (h.investor_name && h.investor_name.toLowerCase() === matchedClient.investor_name.toLowerCase())
      );
      const newAum = clientAllHoldings.reduce((sum, h) => sum + (h.current_value || 0), 0);
      const updatedClient = { ...matchedClient, aum: newAum, updated_at: new Date().toISOString() };
      await localDb.put('client_master', updatedClient);
      setClientMaster(prev => prev.map(c => c.client_id === updatedClient.client_id ? updatedClient : c));
      setClients(prev => prev.map(c => (c.client_id || (c as any).id) === updatedClient.client_id ? { ...c, aum: newAum } : c));
    }
  };

  // Delete Holding & Auto-Recalculate Client AUM
  const handleDeleteHolding = async (holdingId: string) => {
    const targetHolding = holdings.find(h => h.id === holdingId);
    await localDb.delete('holdings', holdingId);
    const nextHoldings = holdings.filter(h => h.id !== holdingId);
    setHoldings(nextHoldings);

    if (targetHolding) {
      const matchedClient = clientMaster.find(c =>
        (c.pan && c.pan === targetHolding.pan) ||
        (c.investor_name && c.investor_name.toLowerCase() === targetHolding.investor_name.toLowerCase())
      );
      if (matchedClient) {
        const clientAllHoldings = nextHoldings.filter(h =>
          (matchedClient.pan && h.pan === matchedClient.pan) ||
          (h.investor_name && h.investor_name.toLowerCase() === matchedClient.investor_name.toLowerCase())
        );
        const newAum = clientAllHoldings.reduce((sum, h) => sum + (h.current_value || 0), 0);
        const updatedClient = { ...matchedClient, aum: newAum, updated_at: new Date().toISOString() };
        await localDb.put('client_master', updatedClient);
        setClientMaster(prev => prev.map(c => c.client_id === updatedClient.client_id ? updatedClient : c));
        setClients(prev => prev.map(c => (c.client_id || (c as any).id) === updatedClient.client_id ? { ...c, aum: newAum } : c));
      }
    }
  };

  // Global Profile Merging Handler
  const handleMergeClients = async (
    primaryClientId: string,
    secondaryClientIds: string[],
    consolidated: Partial<ClientMasterRecord>
  ) => {
    const primary = clientMaster.find(c => c.client_id === primaryClientId);
    if (!primary) return;

    const secondaryClients = clientMaster.filter(c => secondaryClientIds.includes(c.client_id));
    const secondaryNames = new Set(secondaryClients.map(c => c.investor_name.toLowerCase()));
    const secondaryPans = new Set(secondaryClients.map(c => (c.pan || '').toUpperCase()).filter(Boolean));
    const secondaryIdSet = new Set(secondaryClientIds);

    // 1. Update primary client record
    const updatedPrimary: ClientMasterRecord = {
      ...primary,
      ...consolidated,
      updated_at: new Date().toISOString()
    };
    await localDb.put('client_master', updatedPrimary);
    await localDb.put('clients', {
      id: updatedPrimary.client_id,
      client_id: updatedPrimary.client_id,
      pan_number: updatedPrimary.pan || '',
      full_name: updatedPrimary.investor_name,
      mobile: updatedPrimary.mobile || '',
      email: updatedPrimary.email || '',
      dob: updatedPrimary.dob,
      client_type: 'Retail'
    });

    // 2. Delete secondary client records
    for (const sId of secondaryClientIds) {
      await localDb.delete('client_master', sId);
      await localDb.delete('clients', sId);
    }

    // 3. Re-point Insurance Policies and covered members
    let modifiedPolicies = false;
    const nextInsurancePolicies = insurancePolicies.map(pol => {
      let polChanged = false;
      let updatedPol = { ...pol };

      if (updatedPol.primary_client_id && secondaryIdSet.has(updatedPol.primary_client_id)) {
        updatedPol.primary_client_id = primaryClientId;
        polChanged = true;
      }
      if (secondaryNames.has(updatedPol.client_name.toLowerCase())) {
        updatedPol.client_name = updatedPrimary.investor_name;
        polChanged = true;
      }
      if (updatedPol.proposer_name && secondaryNames.has(updatedPol.proposer_name.toLowerCase())) {
        updatedPol.proposer_name = updatedPrimary.investor_name;
        polChanged = true;
      }
      if (updatedPol.members && updatedPol.members.length > 0) {
        updatedPol.members = updatedPol.members.map(m => {
          if ((m.client_id && secondaryIdSet.has(m.client_id)) || secondaryNames.has(m.member_name.toLowerCase())) {
            polChanged = true;
            return {
              ...m,
              client_id: primaryClientId,
              member_name: updatedPrimary.investor_name,
              dob: updatedPrimary.dob || m.dob
            };
          }
          return m;
        });
      }

      if (polChanged) {
        modifiedPolicies = true;
        localDb.put('insurance_policies', updatedPol);
      }
      return updatedPol;
    });

    // 4. Re-point Holdings & recalculate AUM
    const nextHoldings = holdings.map(h => {
      if (
        secondaryNames.has(h.investor_name.toLowerCase()) ||
        (h.pan && secondaryPans.has(h.pan.toUpperCase()))
      ) {
        const updatedH = {
          ...h,
          investor_name: updatedPrimary.investor_name,
          pan: updatedPrimary.pan || h.pan
        };
        localDb.put('holdings', updatedH);
        return updatedH;
      }
      return h;
    });

    const primaryHoldings = nextHoldings.filter(h =>
      (updatedPrimary.pan && h.pan === updatedPrimary.pan) ||
      h.investor_name.toLowerCase() === updatedPrimary.investor_name.toLowerCase()
    );
    const totalAum = primaryHoldings.reduce((sum, h) => sum + (h.current_value || 0), 0);
    updatedPrimary.aum = totalAum;
    await localDb.put('client_master', updatedPrimary);

    // 5. Update State
    setClientMaster(prev => [updatedPrimary, ...prev.filter(c => c.client_id !== primaryClientId && !secondaryIdSet.has(c.client_id))]);
    setClients(prev => [
      {
        id: updatedPrimary.client_id,
        client_id: updatedPrimary.client_id,
        pan_number: updatedPrimary.pan || '',
        full_name: updatedPrimary.investor_name,
        mobile: updatedPrimary.mobile || '',
        email: updatedPrimary.email || '',
        dob: updatedPrimary.dob,
        client_type: 'Retail'
      },
      ...prev.filter(c => (c.client_id || (c as any).id) !== primaryClientId && !secondaryIdSet.has(c.client_id || (c as any).id))
    ]);
    if (modifiedPolicies) setInsurancePolicies(nextInsurancePolicies);
    setHoldings(nextHoldings);

    alert(`Profiles Merged Successfully!\nUnified into "${updatedPrimary.investor_name}".\nAll linked insurance policies, floater members, and portfolio holdings re-assigned globally.`);
  };

  // Add or Update Insurer Registry Entry
  const handleAddOrUpdateInsurer = async (insurer: InsurerRecord) => {
    await localDb.put('insurer_registry', insurer);
    setInsurers(prev => {
      const filtered = prev.filter(i => i.id !== insurer.id && i.name.toLowerCase() !== insurer.name.toLowerCase());
      return [insurer, ...filtered];
    });
    alert(`Insurer "${insurer.name}" registered in Verified Claims Registry.`);
  };

  // Two-Way Sync Handler
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const supabase = getSupabase();
      if (!supabase) {
        alert('Supabase is not configured yet. Opening Settings to configure credentials.');
        setIsSettingsOpen(true);
        setIsSyncing(false);
        return;
      }
      const outboxItems = await localDb.getOutbox();
      if (outboxItems.length > 0) {
        await localDb.clearOutbox();
      }
      alert('Local CRM records are fully synchronized with Cloud database.');
    } catch (err: any) {
      console.error('Sync failed:', err);
      alert('Sync failed: ' + err?.message);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-amber-500 selection:text-white pb-16 md:pb-0">
      {/* Header */}
      <Header
        isOnline={isOnline}
        isSyncing={isSyncing}
        onSync={handleSync}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingShieldCount={shieldAlerts.filter(a => !a.dispatched).length}
        todayCelebrationCount={todayCelebrations.length}
        reviewQueueCount={clientReviewQueue.length}
      />

      {/* Main View Container (Utilising 80-90% Viewport on Desktop) */}
      <main className="flex-1 max-w-[92vw] 2xl:max-w-[1780px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 md:py-7">
        {activeTab === 'cockpit' && (
          <DashboardCockpit
            totalAum={totalHoldingAum}
            monthlySipCommitment={totalMonthlySipCommitment}
            holdingsCount={holdings.length}
            sipsCount={sips.length}
            leads={leads}
            policies={policies}
            shieldAlerts={shieldAlerts}
            todayCelebrations={todayCelebrations}
            onNavigate={setActiveTab}
            onOpenAddLead={() => setActiveTab('pipeline')}
          />
        )}

        {activeTab === 'client360' && (
          <ClientMasterWorkspace
            clients={clientMaster}
            holdings={holdings}
            sips={sips}
            policies={policies}
            insurancePolicies={insurancePolicies}
            leads={leads}
            importHistory={clientImportHistory}
            reviewQueue={clientReviewQueue}
            changeLogs={clientChangeLogs}
            onCommitImport={handleCommitClientImport}
            onSaveManualEdit={handleSaveClientManualEdit}
            onResolveReview={handleResolveReview}
            onDeleteClient={handleDeleteClient}
            onBulkDeleteClients={handleBulkDeleteClients}
            onUpdateHolding={handleUpdateHolding}
            onDeleteHolding={handleDeleteHolding}
            onDeletePolicy={handleDeleteInsurancePolicy}
            onNavigateToContentStudio={() => setActiveTab('content')}
            onMergeClients={handleMergeClients}
          />
        )}

        {activeTab === 'sips' && (
          <MutualFundsWorkspace
            holdings={holdings}
            sips={sips}
            batches={batches}
            onSaveHoldings={handleSaveHoldings}
            onSaveSips={handleSaveSips}
            onUpdateHolding={handleUpdateHolding}
            onDeleteHolding={handleDeleteHolding}
          />
        )}

        {activeTab === 'shield' && (
          <SipShieldTab
            alerts={shieldAlerts}
            currentDate={simulatedDate}
            onDateChange={setSimulatedDate}
            onToggleDispatched={handleToggleDispatched}
          />
        )}

        {activeTab === 'protection' && (
          <ProtectionVault
            policies={policies}
            insurancePolicies={insurancePolicies}
            clients={clientMaster}
            insurers={insurers}
            onAddOrUpdateInsurer={handleAddOrUpdateInsurer}
            onMergeClients={handleMergeClients}
            onOpenUploadModal={() => setIsUploadPolicyOpen(true)}
            onUpdatePolicy={async (updatedPolicy) => {
              await localDb.put('insurance_policies', updatedPolicy);
              setInsurancePolicies(prev => prev.map(p => p.id === updatedPolicy.id ? updatedPolicy : p));
              if (updatedPolicy.members && updatedPolicy.members.length > 0) {
                const syncRes = syncPolicyMembersToClientMaster(updatedPolicy, clientMaster);
                if (syncRes.updatedClients.length > 0) {
                  setClientMaster(syncRes.updatedClients);
                  await localDb.putMany('client_master', syncRes.updatedClients);
                }
              }
            }}
            onDeletePolicy={handleDeleteInsurancePolicy}
            onBulkDeletePolicies={handleBulkDeletePolicies}
            onClearDemoPolicies={handleClearDemoPolicies}
            onUpdateClients={async (newClients) => {
              setClientMaster(newClients);
              await localDb.putMany('client_master', newClients);
            }}
            onNavigateToContentStudio={() => {
              setActiveTab('content');
            }}
          />
        )}

        {activeTab === 'homeloan' && (
          <HomeLoanAcquisitionView />
        )}

        {activeTab === 'pipeline' && (
          <NewLeadsProspectsManager
            leads={leads}
            clients={clientMaster}
            onAddLead={async (newLead: Lead) => {
              await localDb.put('leads', newLead);
              setLeads(prev => [newLead, ...prev.filter(l => l.id !== newLead.id)]);
              alert('Lead recorded successfully!');
            }}
            onDeleteLead={async (leadId: string) => {
              if (window.confirm('Are you sure you want to delete this prospect from pipeline?')) {
                await localDb.delete('leads', leadId);
                setLeads(prev => prev.filter(l => l.id !== leadId));
              }
            }}
          />
        )}

        {activeTab === 'content' && (
          <ContentStudioView clients={clientMaster} leads={leads} />
        )}

        {activeTab === 'celebrations' && (
          <ClientMasterWorkspace
            clients={clientMaster}
            holdings={holdings}
            sips={sips}
            policies={policies}
            insurancePolicies={insurancePolicies}
            leads={leads}
            importHistory={clientImportHistory}
            reviewQueue={clientReviewQueue}
            changeLogs={clientChangeLogs}
            onCommitImport={handleCommitClientImport}
            onSaveManualEdit={handleSaveClientManualEdit}
            onResolveReview={handleResolveReview}
            onDeleteClient={handleDeleteClient}
            onBulkDeleteClients={handleBulkDeleteClients}
            onUpdateHolding={handleUpdateHolding}
            onDeleteHolding={handleDeleteHolding}
            onDeletePolicy={handleDeleteInsurancePolicy}
            onNavigateToContentStudio={() => setActiveTab('content')}
          />
        )}
      </main>

      {/* Global Modals */}
      <GlobalSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        clients={clients}
        sips={sips as any}
        leads={leads}
        policies={policies}
        onNavigate={(tab) => {
          setActiveTab(tab);
          setIsSearchOpen(false);
        }}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onManualSync={handleSync}
      />

      <UploadPolicyModal
        isOpen={isUploadPolicyOpen}
        onClose={() => setIsUploadPolicyOpen(false)}
        onSave={handleSavePolicy}
      />

      <InstallPrompt />
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenQuickActions={() => setActiveTab('sips')}
        pendingShieldCount={shieldAlerts.filter(a => !a.dispatched).length}
        todayCelebrationCount={todayCelebrations.length}
      />
    </div>
  );
};
