import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Calendar,
  Upload,
  Search,
  Filter,
  Users,
  AlertCircle,
  FileText,
  Heart,
  Car,
  Activity,
  Home,
  Briefcase,
  Plane,
  Clock,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Sparkles,
  PhoneCall,
  UserPlus
} from 'lucide-react';
import { ProtectionAsset, ClientMasterRecord } from '../types';
import {
  InsurancePolicy,
  InsuranceVertical,
  PolicyMember,
  PolicyStatus
} from '../types/insurance';
import { generateWhatsAppUrl } from '../lib/whatsAppRouter';
import { SYNTHETIC_INSURANCE_POLICIES } from '../data/syntheticInsuranceFixtures';
import { syncPolicyMembersToClientMaster } from '../lib/insuranceClientSync';

interface ProtectionVaultProps {
  policies?: ProtectionAsset[];
  insurancePolicies?: InsurancePolicy[];
  clients?: ClientMasterRecord[];
  onOpenUploadModal: () => void;
  onUpdatePolicy?: (policy: InsurancePolicy) => void;
  onUpdateClients?: (updatedClients: ClientMasterRecord[]) => void;
  onNavigateToContentStudio?: (preset?: string) => void;
}

export const ProtectionVault: React.FC<ProtectionVaultProps> = ({
  policies = [],
  insurancePolicies = [],
  clients = [],
  onOpenUploadModal,
  onUpdatePolicy,
  onUpdateClients,
  onNavigateToContentStudio
}) => {
  // Combine incoming insurancePolicies with synthetic fixtures if empty, plus fallback legacy
  const activeInsurancePolicies = useMemo<InsurancePolicy[]>(() => {
    if (insurancePolicies && insurancePolicies.length > 0) {
      return insurancePolicies;
    }
    // If legacy policies exist, they will have migrated; otherwise use authoritative synthetic set
    return SYNTHETIC_INSURANCE_POLICIES;
  }, [insurancePolicies]);

  // Sub-navigation within Insurance CRM
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'policies' | 'members' | 'renewals' | 'claims'>('overview');
  const [selectedVertical, setSelectedVertical] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPolicy, setSelectedPolicy] = useState<InsurancePolicy | null>(null);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Filtered Policies
  const filteredPolicies = useMemo(() => {
    return activeInsurancePolicies.filter(p => {
      const matchVertical = selectedVertical === 'ALL' || p.vertical === selectedVertical;
      const matchSearch =
        searchQuery.trim() === '' ||
        p.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.policy_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.insurer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.vertical_data && (p.vertical_data as any).registration_number?.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchVertical && matchSearch;
    });
  }, [activeInsurancePolicies, selectedVertical, searchQuery]);

  // Key KPI Aggregates
  const stats = useMemo(() => {
    const totalPolicies = activeInsurancePolicies.length;
    const totalSumInsured = activeInsurancePolicies.reduce((sum, p) => sum + (p.sum_insured || 0), 0);
    const totalAnnualPremium = activeInsurancePolicies.reduce((sum, p) => sum + (p.gross_premium || p.net_premium || 0), 0);

    const now = new Date();
    const upcomingRenewals = activeInsurancePolicies.filter(p => {
      if (!p.expiry_date) return false;
      const exp = new Date(p.expiry_date);
      const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 45;
    });

    const allMembers = activeInsurancePolicies.flatMap(p => p.members || []);

    return {
      totalPolicies,
      totalSumInsured,
      totalAnnualPremium,
      upcomingRenewalsCount: upcomingRenewals.length,
      coveredMembersCount: allMembers.length,
      upcomingRenewals
    };
  }, [activeInsurancePolicies]);

  // Handle Synchronizing Family Members to Client Master
  const handleSyncMembers = (policy: InsurancePolicy) => {
    const res = syncPolicyMembersToClientMaster(policy, clients);
    if (onUpdateClients) {
      onUpdateClients(res.updatedClients);
    }
    setSyncFeedback(`Successfully synchronized ${res.newMembersAdded.length} new family member(s) into Client Master! Birthday alerts are now active.`);
    setTimeout(() => setSyncFeedback(null), 5000);
  };

  // Helper for vertical icon & color badge
  const getVerticalBadge = (vertical: InsuranceVertical) => {
    switch (vertical) {
      case 'HEALTH':
        return { label: 'Health Floater', icon: Activity, bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'MOTOR':
        return { label: 'Motor Vehicle', icon: Car, bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'LIFE':
        return { label: 'Life / Term', icon: Heart, bg: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'COMMERCIAL_GENERAL':
        return { label: 'Commercial / Fire', icon: Briefcase, bg: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'HOME_PROPERTY':
        return { label: 'Home / Property', icon: Home, bg: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'TRAVEL':
        return { label: 'Travel Overseas', icon: Plane, bg: 'bg-cyan-50 text-cyan-700 border-cyan-200' };
      default:
        return { label: 'General Insurance', icon: ShieldCheck, bg: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="glass-panel p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 flex items-center justify-center font-bold shadow-sm">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl md:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
                  Protection Vault & Insurance CRM
                </h2>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                  ANTOS Insurance v5
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-500 mt-0.5">
                Multi-vertical policy repository, OCR extraction intelligence, family health floater sync & 30-day renewal workflows.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenUploadModal}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs md:text-sm flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Upload / Scan Policy</span>
          </button>
        </div>
      </div>

      {/* Synchronize Notification */}
      {syncFeedback && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs md:text-sm font-semibold flex items-center gap-2 animate-fade-in shadow-xs">
          <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{syncFeedback}</span>
        </div>
      )}

      {/* 4 Core KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Active Policies</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            {stats.totalPolicies}
          </div>
          <p className="text-[10px] text-slate-400">Health, Motor, Life & Fire</p>
        </div>

        <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Total Sum Insured</span>
            <Activity className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-blue-700">
            ₹{(stats.totalSumInsured / 10000000).toFixed(2)} Cr
          </div>
          <p className="text-[10px] text-slate-400">Client aggregate protection limit</p>
        </div>

        <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Annual Premium Outflow</span>
            <Calendar className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-700">
            ₹{stats.totalAnnualPremium.toLocaleString('en-IN')}
          </div>
          <p className="text-[10px] text-slate-400">Consolidated book premium</p>
        </div>

        <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Covered Family Members</span>
            <Users className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-700">
            {stats.coveredMembersCount} Lives
          </div>
          <p className="text-[10px] text-slate-400">Spouses, Kids & Parents synced</p>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 border-b border-slate-200">
        {[
          { id: 'overview', label: 'Overview & Radar' },
          { id: 'policies', label: `Policies Directory (${activeInsurancePolicies.length})` },
          { id: 'members', label: `Family Health Coverage & Birthdays (${stats.coveredMembersCount})` },
          { id: 'renewals', label: `Renewals Due (${stats.upcomingRenewalsCount})` },
          { id: 'claims', label: 'Claims Desk & TPA' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              activeSubTab === tab.id
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* SUB-VIEW 1: OVERVIEW & RADAR */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Upcoming Renewal Radar */}
          {stats.upcomingRenewalsCount > 0 && (
            <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-700" />
                  <h3 className="font-extrabold text-amber-900 text-sm md:text-base">
                    Action Required: {stats.upcomingRenewalsCount} Policies Expiring Soon (30-Day Window)
                  </h3>
                </div>
                <button
                  onClick={() => setActiveSubTab('renewals')}
                  className="text-xs font-bold text-amber-800 hover:text-amber-900 underline flex items-center gap-1"
                >
                  <span>View Renewal Pipeline</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {stats.upcomingRenewals.map(pol => {
                  const daysLeft = Math.ceil(
                    (new Date(pol.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                  );
                  const waMsg = `Dear ${pol.client_name}, this is an advance reminder from AntFinServ (ARN-94204) regarding your ${pol.product_name} policy (${pol.policy_number}) with ${pol.insurer_name}. It is scheduled for renewal on ${pol.expiry_date} (${daysLeft} days remaining). Please let us know if you wish to review your no-claim bonus or explore continuous coverage.`;
                  const waUrl = generateWhatsAppUrl(pol.proposer_mobile || '', waMsg);

                  return (
                    <div key={pol.id} className="p-3.5 rounded-xl bg-white border border-amber-200 shadow-xs space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                            {daysLeft <= 7 ? `URGENT: ${daysLeft}d Left` : `${daysLeft} Days to Expiry`}
                          </span>
                          <h4 className="font-bold text-sm text-slate-900 mt-1">{pol.client_name}</h4>
                          <p className="text-xs text-slate-500 font-mono">{pol.policy_number}</p>
                        </div>
                        <span className="text-xs font-bold text-slate-900">₹{pol.net_premium.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <span className="text-[11px] text-slate-500">{pol.insurer_name}</span>
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-all"
                        >
                          Send WhatsApp
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Category Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Health Insurance Floaters */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-600" />
                  <h4 className="font-extrabold text-slate-900 text-sm">Health Insurance Floaters</h4>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                  {activeInsurancePolicies.filter(p => p.vertical === 'HEALTH').length} Plans
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Comprehensive family floater policies with family member DOB tracking, restoration benefits, and cashless network mapping.
              </p>
              <button
                onClick={() => { setSelectedVertical('HEALTH'); setActiveSubTab('policies'); }}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
              >
                <span>Filter Health Policies</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Motor Vehicles */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Car className="w-5 h-5 text-blue-600" />
                  <h4 className="font-extrabold text-slate-900 text-sm">Motor Vehicle Policies</h4>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                  {activeInsurancePolicies.filter(p => p.vertical === 'MOTOR').length} Vehicles
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Zero-depreciation, IDV, engine protector, consumables, and NCB tracking for high-value client cars and two-wheelers.
              </p>
              <button
                onClick={() => { setSelectedVertical('MOTOR'); setActiveSubTab('policies'); }}
                className="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1"
              >
                <span>Filter Motor Policies</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Life & Term Protection */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-rose-600" />
                  <h4 className="font-extrabold text-slate-900 text-sm">Life & Pure Term Vault</h4>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700">
                  {activeInsurancePolicies.filter(p => p.vertical === 'LIFE').length} Bonds
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Pure term protection up to ₹2+ Crore sum assured, nominee mapping, and accidental disability rider tracking.
              </p>
              <button
                onClick={() => { setSelectedVertical('LIFE'); setActiveSubTab('policies'); }}
                className="text-xs font-bold text-rose-700 hover:text-rose-800 flex items-center gap-1"
              >
                <span>Filter Life Policies</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: POLICIES DIRECTORY */}
      {activeSubTab === 'policies' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full md:w-auto pb-1">
              {[
                { id: 'ALL', label: 'All Verticals' },
                { id: 'HEALTH', label: 'Health' },
                { id: 'MOTOR', label: 'Motor' },
                { id: 'LIFE', label: 'Life/Term' },
                { id: 'COMMERCIAL_GENERAL', label: 'Commercial' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedVertical(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    selectedVertical === cat.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search policy, client, car no..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-500 shadow-xs"
              />
            </div>
          </div>

          {/* Policies Grid */}
          {filteredPolicies.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-slate-200 bg-white space-y-2">
              <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
              <h4 className="font-bold text-slate-700">No matching insurance policies found</h4>
              <p className="text-xs text-slate-500">Try changing your search term or category filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredPolicies.map(pol => {
                const badge = getVerticalBadge(pol.vertical);
                const BadgeIcon = badge.icon;
                const memberCount = pol.members?.length || 1;

                return (
                  <div
                    key={pol.id}
                    className="glass-panel p-5 rounded-2xl border border-slate-200 hover:border-emerald-300 transition-all shadow-xs space-y-4 cursor-pointer"
                    onClick={() => setSelectedPolicy(pol)}
                  >
                    {/* Top Row: Vertical & Insurer */}
                    <div className="flex items-start justify-between gap-2">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${badge.bg}`}>
                        <BadgeIcon className="w-3 h-3" />
                        <span>{badge.label}</span>
                      </span>
                      <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                        {pol.insurer_name}
                      </span>
                    </div>

                    {/* Client & Product Name */}
                    <div>
                      <h4 className="font-extrabold text-base text-slate-900">{pol.client_name}</h4>
                      <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">{pol.product_name}</p>
                      <p className="text-[11px] font-mono text-slate-400 mt-1">
                        Policy #{pol.policy_number}
                        {(pol.vertical_data as any)?.registration_number && (
                          <span className="ml-2 font-bold text-blue-700 font-sans">
                            ({(pol.vertical_data as any).registration_number})
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Coverage & Premium */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400">Sum Insured</span>
                        <p className="font-extrabold text-sm text-slate-900">
                          ₹{pol.sum_insured.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400">Net Premium</span>
                        <p className="font-extrabold text-sm text-amber-700">
                          ₹{pol.net_premium.toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>

                    {/* Covered Members & Expiry */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-medium">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        {memberCount} Member{memberCount > 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Expires: <strong className="text-slate-700">{pol.expiry_date}</strong>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-VIEW 3: FAMILY HEALTH COVERAGE & BIRTHDAYS */}
      {activeSubTab === 'members' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Heart className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <div>
                <h3 className="font-extrabold text-rose-950 text-sm">
                  Family Health Floater Members & Birthday Intelligence
                </h3>
                <p className="text-xs text-rose-800/80">
                  Every family member extracted from health policies (Spouses, Sons, Daughters, Parents) is synchronized with their Date of Birth into the Client Master for automated birthday wishes in Content Studio!
                </p>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3.5">Family Member</th>
                    <th className="p-3.5">Relationship to Head</th>
                    <th className="p-3.5">Date of Birth (DOB)</th>
                    <th className="p-3.5">Household Proposer</th>
                    <th className="p-3.5">Health Policy</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {activeInsurancePolicies
                    .flatMap(pol => (pol.members || []).map(m => ({ member: m, policy: pol })))
                    .map(({ member, policy }) => (
                      <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3.5">
                          <div className="font-extrabold text-slate-900">{member.member_name}</div>
                          <span className="text-[10px] text-slate-400">ID: {member.id}</span>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-bold border border-rose-200">
                            {member.relationship_to_head}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-slate-900 font-bold">
                          {member.dob || <span className="text-slate-400 font-normal">Not Sourced</span>}
                        </td>
                        <td className="p-3.5">
                          <span className="font-semibold text-slate-800">{policy.client_name}</span>
                        </td>
                        <td className="p-3.5">
                          <div className="text-slate-900 font-semibold">{policy.insurer_name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{policy.policy_number}</div>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => {
                              handleSyncMembers(policy);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] border border-emerald-200 transition-all mr-1.5"
                            title="Sync this family member to Client Master"
                          >
                            Sync to Client Master
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 4: RENEWALS PIPELINE */}
      {activeSubTab === 'renewals' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-700" />
              <div>
                <h4 className="font-bold text-amber-900 text-sm">30-Day Anniversary Renewal Pipeline</h4>
                <p className="text-xs text-amber-700">Pre-composed WhatsApp dispatches with ARN-94204 verified branding.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeInsurancePolicies.map(pol => {
              const daysLeft = Math.ceil(
                (new Date(pol.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              );
              const waMsg = `Dear ${pol.client_name}, your ${pol.product_name} (${pol.policy_number}) with ${pol.insurer_name} is due for renewal on ${pol.expiry_date}. As your trusted financial advisor at AntFinServ (ARN-94204), we ensure continuous coverage with no-claim bonus preservation. Please confirm your renewal preference.`;
              const waUrl = generateWhatsAppUrl(pol.proposer_mobile || '', waMsg);

              return (
                <div key={pol.id} className="glass-panel p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">{pol.client_name}</h4>
                      <p className="text-xs text-slate-500 line-clamp-1">{pol.product_name}</p>
                      <p className="text-xs font-mono text-slate-400 mt-0.5">{pol.policy_number}</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      daysLeft <= 15 ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {daysLeft > 0 ? `${daysLeft}d left` : 'Expired'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Renewal Premium</span>
                      <strong className="text-slate-900 font-extrabold text-sm">₹{pol.net_premium.toLocaleString('en-IN')}</strong>
                    </div>
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Dispatch WhatsApp</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-VIEW 5: CLAIMS DESK */}
      {activeSubTab === 'claims' && (
        <div className="glass-panel p-8 text-center rounded-2xl border border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-slate-900 text-base">Cashless Claims Desk Active</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Currently zero pending claims. All active health, motor, and term policies are in good standing with respective TPAs (Star Health In-House, HDFC ERGO Cashless Garage Network, Tata AIA).
          </p>
        </div>
      )}

      {/* POLICY DETAIL DRAWER / MODAL */}
      {selectedPolicy && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl p-6 overflow-y-auto space-y-5 flex flex-col">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {selectedPolicy.vertical}
                </span>
                <h3 className="font-black text-lg text-slate-900 mt-1">{selectedPolicy.client_name}</h3>
                <p className="text-xs text-slate-500 font-mono">{selectedPolicy.policy_number}</p>
              </div>
              <button
                onClick={() => setSelectedPolicy(null)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-xl text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Financial Overview */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Sum Insured</span>
                <p className="text-base font-extrabold text-slate-900">₹{selectedPolicy.sum_insured.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Net Premium</span>
                <p className="text-base font-extrabold text-amber-700">₹{selectedPolicy.net_premium.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Inception Date</span>
                <p className="font-semibold text-slate-700">{selectedPolicy.inception_date}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Expiry Date</span>
                <p className="font-semibold text-slate-700">{selectedPolicy.expiry_date}</p>
              </div>
            </div>

            {/* Covered Members List */}
            {selectedPolicy.members && selectedPolicy.members.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-rose-600" />
                    <span>Covered Family Members ({selectedPolicy.members.length})</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => handleSyncMembers(selectedPolicy)}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 underline"
                  >
                    Sync All to Client Master
                  </button>
                </div>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
                  {selectedPolicy.members.map(m => (
                    <div key={m.id} className="p-3 bg-white flex items-center justify-between">
                      <div>
                        <strong className="text-slate-900">{m.member_name}</strong>
                        <div className="text-[10px] text-slate-400">
                          Relation: <span className="text-slate-700 font-semibold">{m.relationship_to_head}</span> | DOB: <span className="font-mono text-slate-700 font-semibold">{m.dob}</span>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">
                        {m.is_primary_insured ? 'Primary' : 'Dependent'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dynamic Vertical Specs */}
            {selectedPolicy.vertical_data && (
              <div className="space-y-2">
                <h4 className="font-bold text-xs text-slate-900">Vertical Policy Specifications</h4>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5 font-mono text-slate-700">
                  {Object.entries(selectedPolicy.vertical_data).map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px] uppercase font-sans font-bold">{k.replace(/_/g, ' ')}:</span>
                      <span className="font-semibold text-slate-900">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-200 flex gap-2">
              <button
                onClick={() => setSelectedPolicy(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
              >
                Close Drawer
              </button>
              <button
                onClick={() => handleSyncMembers(selectedPolicy)}
                className="flex-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Sync Family to Master & Birthdays
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};