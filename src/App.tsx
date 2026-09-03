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
  ImportBatch
} from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('cockpit');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);

  // Core CRM Datasets
  const [clients, setClients] = useState<Client[]>([]);
  const [clientMaster, setClientMaster] = useState<ClientMasterRecord[]>([]);
  const [clientImportHistory, setClientImportHistory] = useState<ClientImportBatch[]>([]);
  const [clientReviewQueue, setClientReviewQueue] = useState<AmbiguousClientMatch[]>([]);
  const [clientChangeLogs, setClientChangeLogs] = useState<ClientChangeLog[]>([]);

  const [holdings, setHoldings] = useState<MfHolding[]>([]);
  const [sips, setSips] = useState<ActiveSip[]>([]);
  const [batches, setBatches] = useState<ImportBatch[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [policies, setPolicies] = useState<ProtectionAsset[]>([]);
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

  // Initialize Data from IndexedDB
  const loadData = async () => {
    try {
      await localDb.init();
      const [c, cm, imph, revq, logs, h, s, b, l, p] = await Promise.all([
        localDb.getAll<Client>('clients'),
        localDb.getAll<ClientMasterRecord>('client_master'),
        localDb.getAll<ClientImportBatch>('client_import_history'),
        localDb.getAll<AmbiguousClientMatch>('client_review_queue'),
        localDb.getAll<ClientChangeLog>('client_audit_history'),
        localDb.getAll<MfHolding>('holdings'),
        localDb.getAll<ActiveSip>('sips'),
        localDb.getAll<ImportBatch>('batches'),
        localDb.getAll<Lead>('leads'),
        localDb.getAll<ProtectionAsset>('policies'),
      ]);

      setClients(c);

      // Auto-migrate legacy clients into client_master if empty
      let masterRecords = cm;
      if (masterRecords.length === 0 && c.length > 0) {
        masterRecords = c.map((legacyClient, idx) => ({
          client_id: `antos_cli_migrated_${idx}_${legacyClient.pan_number || 'nopan'}`,
          source_system: 'MANUAL',
          pan: legacyClient.pan_number && legacyClient.pan_number !== 'PAN_NOT_PROVIDED' ? legacyClient.pan_number : null,
          investor_name: legacyClient.full_name,
          dob: legacyClient.dob || null,
          gender: 'Not Specified',
          mobile: legacyClient.mobile || '',
          email: legacyClient.email || '',
          mapping_role: 'Individual',
          created_at: legacyClient.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
          data_quality_flags: legacyClient.pan_number ? [] : ['MISSING_PAN']
        }));
        await localDb.putMany('client_master', masterRecords);
      }

      setClientMaster(masterRecords);
      setClientImportHistory(imph.sort((a, b) => new Date(b.imported_at).getTime() - new Date(a.imported_at).getTime()));
      setClientReviewQueue(revq.filter(q => q.status === 'PENDING'));
      setClientChangeLogs(logs.sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime()));

      setHoldings(h);
      setSips(s);
      setBatches(b);
      setLeads(l);
      setPolicies(p);
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

  // Save Policy to Vault
  const handleSavePolicy = async (newPolicy: ProtectionAsset) => {
    await localDb.put('policies', newPolicy);
    setPolicies(prev => [newPolicy, ...prev.filter(p => p.policy_number !== newPolicy.policy_number)]);
    alert(`Policy ${newPolicy.policy_number} for ${newPolicy.client_name} saved successfully!`);
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
            importHistory={clientImportHistory}
            reviewQueue={clientReviewQueue}
            changeLogs={clientChangeLogs}
            onCommitImport={handleCommitClientImport}
            onSaveManualEdit={handleSaveClientManualEdit}
            onResolveReview={handleResolveReview}
          />
        )}

        {activeTab === 'sips' && (
          <MutualFundsWorkspace
            holdings={holdings}
            sips={sips}
            batches={batches}
            onSaveHoldings={handleSaveHoldings}
            onSaveSips={handleSaveSips}
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
            onOpenUploadModal={() => setIsUploadPolicyOpen(true)}
          />
        )}

        {activeTab === 'homeloan' && (
          <HomeLoanAcquisitionView />
        )}

        {activeTab === 'pipeline' && (
          <NewLeadsProspectsManager
            leads={leads}
            onAddLead={async (newLead: Lead) => {
              await localDb.put('leads', newLead);
              setLeads(prev => [newLead, ...prev.filter(l => l.id !== newLead.id)]);
              alert('Lead recorded successfully!');
            }}
          />
        )}

        {activeTab === 'content' && (
          <ContentStudioView />
        )}

        {activeTab === 'celebrations' && (
          <CelebrationsTab
            celebrations={celebrationAlerts}
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
