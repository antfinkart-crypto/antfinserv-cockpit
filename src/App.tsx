import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DashboardCockpit } from './components/DashboardCockpit';
import { SipShieldTab } from './components/SipShieldTab';
import { CelebrationsTab } from './components/CelebrationsTab';
import { MutualFundsWorkspace } from './components/MutualFundsWorkspace';
import { NewLeadsProspectsManager } from './components/NewLeadsProspectsManager';
import { ProtectionVault } from './components/ProtectionVault';
import { Client360View } from './components/Client360View';
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
import { Client, MfHolding, ActiveSip, Lead, ProtectionAsset, ImportBatch } from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('cockpit');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);

  // Core CRM Datasets
  const [clients, setClients] = useState<Client[]>([]);
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
      const [c, h, s, b, l, p] = await Promise.all([
        localDb.getAll<Client>('clients'),
        localDb.getAll<MfHolding>('holdings'),
        localDb.getAll<ActiveSip>('sips'),
        localDb.getAll<ImportBatch>('batches'),
        localDb.getAll<Lead>('leads'),
        localDb.getAll<ProtectionAsset>('policies'),
      ]);
      setClients(c);
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

  const celebrationAlerts = getCelebrationAlerts(
    clients,
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

    // Auto-discover unique clients from holdings
    const discoveredClients: Client[] = [];
    const clientPanMap = new Set(clients.map(c => c.pan_number));
    newHoldings.forEach(h => {
      if (h.pan && h.pan !== 'PAN_NOT_PROVIDED' && !clientPanMap.has(h.pan)) {
        clientPanMap.add(h.pan);
        discoveredClients.push({
          pan_number: h.pan,
          full_name: h.investor_name,
          mobile: '',
          client_type: 'Retail',
          created_at: new Date().toISOString()
        });
      }
    });

    if (discoveredClients.length > 0) {
      await localDb.putMany('clients', discoveredClients);
      setClients(prev => [...prev, ...discoveredClients]);
    }

    setHoldings(prev => {
      const map = new Map<string, MfHolding>();
      prev.forEach(h => map.set(h.id, h));
      newHoldings.forEach(h => map.set(h.id, h));
      return Array.from(map.values());
    });
    setBatches(prev => [batch, ...prev.filter(b => b.id !== batch.id)]);
    const totalAumVal = newHoldings.reduce((sum, h) => sum + (h.current_value || 0), 0);
    alert('Successfully imported ' + newHoldings.length + ' holdings from ' + batch.file_name + '!\nAuthoritative Portfolio AUM: ₹' + totalAumVal.toLocaleString('en-IN'));
  };

  // Active SIP Import Handler (Preserving multiple SIP mandates per folio/scheme!)
  const handleSaveSips = async (newSips: ActiveSip[], batch: ImportBatch) => {
    await localDb.putMany('sips', newSips);
    await localDb.put('batches', batch);

    // Auto-update mobile contacts on clients
    newSips.forEach(s => {
      if (s.mobile && s.pan_number) {
        const cl = clients.find(c => c.pan_number === s.pan_number);
        if (cl && !cl.mobile) {
          cl.mobile = s.mobile;
          localDb.put('clients', cl);
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
    alert('Successfully imported ' + newSips.length + ' active SIP mandates from ' + batch.file_name + '!\nMonthly Active SIP Commitment: ₹' + totalSipVal.toLocaleString('en-IN') + '/mo');
  };

  // Save Policy to Vault
  const handleSavePolicy = async (newPolicy: ProtectionAsset) => {
    await localDb.put('policies', newPolicy);
    setPolicies(prev => [newPolicy, ...prev.filter(p => p.policy_number !== newPolicy.policy_number)]);
    alert('Policy ' + newPolicy.policy_number + ' for ' + newPolicy.client_name + ' saved successfully!');
  };

  // Save New Prospect
  const handleSaveLead = async (newLead: Lead) => {
    await localDb.put('leads', newLead);
    setLeads(prev => [newLead, ...prev.filter(l => l.id !== newLead.id)]);
    alert('Prospect ' + newLead.firm_name + ' saved successfully!');
  };

  // Sync with Cloud Outbox
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const supabase = getSupabase();
      if (supabase && navigator.onLine) {
        const outbox = await localDb.getOutbox();
        for (const item of outbox) {
          if (item.table_name === 'leads') {
            await supabase.from('leads').upsert(item.payload);
          } else if (item.table_name === 'clients') {
            await supabase.from('clients').upsert(item.payload);
          } else if (item.table_name === 'policies') {
            await supabase.from('protection_assets').upsert(item.payload);
          }
        }
        await localDb.clearOutbox();
      }
      await loadData();
    } catch (err) {
      console.warn('Sync running offline or standalone', err);
    } finally {
      setTimeout(() => setIsSyncing(false), 800);
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
          <Client360View
            clients={clients}
            holdings={holdings}
            sips={sips}
            policies={policies}
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
            onAddLead={handleSaveLead}
          />
        )}

        {activeTab === 'content' && (
          <ContentStudioView />
        )}

        {activeTab === 'celebrations' && (
          <CelebrationsTab
            celebrations={todayCelebrations}
          />
        )}
      </main>

      {/* Modals & Dialogs */}
      <GlobalSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        clients={clients}
        sips={sips as any}
        leads={leads}
        policies={policies}
        onNavigate={(tab) => { setActiveTab(tab); setIsSearchOpen(false); }}
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

      {/* Mobile Nav & Install Prompt */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenQuickActions={() => setActiveTab('sips')}
        pendingShieldCount={shieldAlerts.filter(a => !a.dispatched).length}
        todayCelebrationCount={todayCelebrations.length}
      />

      <InstallPrompt />
    </div>
  );
};