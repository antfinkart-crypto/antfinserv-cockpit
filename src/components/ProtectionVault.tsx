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
  UserPlus,
  Plus,
  Scale,
  FileCheck,
  Building,
  Check,
  X,
  Info,
  Award,
  ArrowRight,
  Layers,
  Trash2,
  Edit3
} from 'lucide-react';
import { ProtectionAsset, ClientMasterRecord } from '../types';
import {
  InsurancePolicy,
  InsuranceVertical,
  PolicyMember,
  PolicyStatus,
  PolicyClaim,
  MarketQuoteComparison
} from '../types/insurance';
import { generateWhatsAppUrl } from '../lib/whatsAppRouter';
import { SYNTHETIC_INSURANCE_POLICIES } from '../data/syntheticInsuranceFixtures';
import { syncPolicyMembersToClientMaster } from '../lib/insuranceClientSync';
import { EditPolicyModal } from './EditPolicyModal';

interface ProtectionVaultProps {
  policies?: ProtectionAsset[];
  insurancePolicies?: InsurancePolicy[];
  clients?: ClientMasterRecord[];
  onOpenUploadModal: () => void;
  onUpdatePolicy?: (policy: InsurancePolicy) => void;
  onDeletePolicy?: (policyId: string) => void;
  onClearDemoPolicies?: () => void;
  onUpdateClients?: (updatedClients: ClientMasterRecord[]) => void;
  onNavigateToContentStudio?: (preset?: string) => void;
}

export const ProtectionVault: React.FC<ProtectionVaultProps> = ({
  policies = [],
  insurancePolicies = [],
  clients = [],
  onOpenUploadModal,
  onUpdatePolicy,
  onDeletePolicy,
  onClearDemoPolicies,
  onUpdateClients,
  onNavigateToContentStudio
}) => {
  // Use authoritative insurancePolicies directly (respecting deletions), with fallback to synthetic only if uninitialized
  const activeInsurancePolicies = useMemo<InsurancePolicy[]>(() => {
    if (insurancePolicies) {
      return insurancePolicies;
    }
    return [];
  }, [insurancePolicies]);

  // Sub-navigation within Insurance CRM
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'policies' | 'members' | 'renewals' | 'claims' | 'comparison'>('overview');
  const [selectedVertical, setSelectedVertical] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPolicy, setSelectedPolicy] = useState<InsurancePolicy | null>(null);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Modals state
  const [isSyncDiffModalOpen, setIsSyncDiffModalOpen] = useState<boolean>(false);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState<boolean>(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState<boolean>(false);
  const [policyToDelete, setPolicyToDelete] = useState<InsurancePolicy | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<boolean>(false);
  const [policyToEdit, setPolicyToEdit] = useState<InsurancePolicy | null>(null);
  const [isEditPolicyModalOpen, setIsEditPolicyModalOpen] = useState<boolean>(false);

  const handleSaveEditedPolicy = async (updatedPolicy: InsurancePolicy) => {
    if (onUpdatePolicy) {
      await onUpdatePolicy(updatedPolicy);
    }
    if (selectedPolicy && selectedPolicy.id === updatedPolicy.id) {
      setSelectedPolicy(updatedPolicy);
    }
    setPolicyToEdit(null);
    setIsEditPolicyModalOpen(false);
    setSyncFeedback(`Policy ${updatedPolicy.policy_number} updated successfully!`);
    setTimeout(() => setSyncFeedback(null), 4000);
  };

  // Claims state (Pre-seeded with institutional settlement records)
  const [claims, setClaims] = useState<PolicyClaim[]>([
    {
      id: 'claim_star_01',
      policy_id: 'antos_pol_star_health_01',
      policy_number: 'P/161114/01/2026/004821',
      claim_number: 'CLM/2026/STR/0942',
      date_of_incident: '2026-02-10',
      date_intimated: '2026-02-10',
      claim_type: 'CASHLESS',
      claim_amount_requested: 145000,
      claim_amount_approved: 142000,
      claim_amount_settled: 142000,
      deductions: 3000,
      claimant_name: 'PRIYA ARORA',
      claimant_relationship: 'Spouse',
      status: 'SETTLED',
      hospital_garage_name: 'Fortis Escorts Heart Institute, New Delhi',
      tpa_reference_number: 'TPA-STAR-DEL-8921',
      remarks: 'Laparoscopic procedure settled directly via In-house cashless desk.',
      created_at: '2026-02-10T10:00:00Z',
      updated_at: '2026-02-15T16:00:00Z'
    },
    {
      id: 'claim_hdfc_02',
      policy_id: 'antos_pol_hdfc_motor_02',
      policy_number: '2312-2004-9842-0000',
      claim_number: 'MOT/2026/HDF/5519',
      date_of_incident: '2026-07-14',
      date_intimated: '2026-07-15',
      claim_type: 'CASHLESS',
      claim_amount_requested: 28500,
      claim_amount_approved: 27500,
      claim_amount_settled: 27500,
      deductions: 1000,
      claimant_name: 'RAI SAHIB',
      claimant_relationship: 'Self',
      status: 'SETTLED',
      hospital_garage_name: 'Hyundai Motor Plaza Workshop, Okhla',
      tpa_reference_number: 'HDFC-CLM-88124',
      remarks: 'Front bumper & sensor replacement under Zero Dep add-on.',
      created_at: '2026-07-15T11:30:00Z',
      updated_at: '2026-07-20T14:20:00Z'
    }
  ]);

  // Market comparison state (IRDAI compliant - verified underwriter quotes only)
  const [comparisons, setComparisons] = useState<MarketQuoteComparison[]>([
    {
      id: 'cmp_health_01',
      policy_id: 'antos_pol_star_health_01',
      vertical: 'HEALTH',
      current_insurer: 'Star Health & Allied Insurance',
      current_sum_insured: 1500000,
      current_premium: 32450,
      alternative_insurer: 'HDFC ERGO General Insurance',
      alternative_plan_name: 'Optima Secure Family Floater',
      quoted_sum_insured: 1500000,
      quoted_premium: 34200,
      features_difference: [
        '2X Secure Benefit (Effective ₹30L day-1 coverage)',
        'Zero capping on Single Private Room',
        '100% cumulative bonus in 2 claim-free years',
        'Restore benefit activates instantly on partial exhaustion'
      ],
      quote_source: 'HDFC ERGO Agency Broker Portal (Ref #HE-UW-49210)',
      quote_date: '2026-08-25',
      valid_until: '2026-10-14',
      status: 'PROPOSED'
    },
    {
      id: 'cmp_motor_02',
      policy_id: 'antos_pol_hdfc_motor_02',
      vertical: 'MOTOR',
      current_insurer: 'HDFC ERGO General Insurance',
      current_sum_insured: 1680000,
      current_premium: 28950,
      alternative_insurer: 'ICICI Lombard General Insurance',
      alternative_plan_name: 'i-Drive Private Car Package with Zero Dep Titanium',
      quoted_sum_insured: 1710000,
      quoted_premium: 27400,
      features_difference: [
        'Higher IDV valuation (+₹30,000)',
        'Includes consumable cover and key replacement without deductible',
        'Cashless garage network across 11,000+ certified service centres'
      ],
      quote_source: 'ICICI Lombard Partner Portal (Ref #IL-MTR-8812)',
      quote_date: '2026-08-28',
      valid_until: '2026-09-27',
      status: 'PRESENTED'
    }
  ]);

  // Form states
  const [newClaimForm, setNewClaimForm] = useState({
    policyId: '',
    claimantName: '',
    incidentDate: new Date().toISOString().split('T')[0],
    claimType: 'CASHLESS' as 'CASHLESS' | 'REIMBURSEMENT',
    hospitalGarage: '',
    amount: '',
    remarks: ''
  });

  const [newQuoteForm, setNewQuoteForm] = useState({
    policyId: '',
    competingInsurer: '',
    planName: '',
    quotedSumInsured: '',
    quotedPremium: '',
    quoteRef: '',
    featuresDiff: ''
  });

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

  // Sync Evaluation for Diff Queue
  const syncQueueEvaluation = useMemo(() => {
    const items: Array<{
      policy: InsurancePolicy;
      member: PolicyMember;
      status: 'ALREADY_SYNCED' | 'NEW_MEMBER' | 'DOB_ENRICHMENT';
      existingClient?: ClientMasterRecord;
    }> = [];

    activeInsurancePolicies.forEach(pol => {
      (pol.members || []).forEach(mem => {
        const cleanName = mem.member_name.trim().toUpperCase();
        const existing = clients.find(
          c => c.investor_name.toUpperCase() === cleanName ||
               (c.family_id === pol.family_id && c.relationship_to_head === mem.relationship_to_head && c.dob === mem.dob)
        );

        if (existing) {
          if (!existing.dob && mem.dob) {
            items.push({ policy: pol, member: mem, status: 'DOB_ENRICHMENT', existingClient: existing });
          } else {
            items.push({ policy: pol, member: mem, status: 'ALREADY_SYNCED', existingClient: existing });
          }
        } else {
          items.push({ policy: pol, member: mem, status: 'NEW_MEMBER' });
        }
      });
    });

    return items;
  }, [activeInsurancePolicies, clients]);

  // Handle Synchronizing Family Members to Client Master
  const handleSyncMembers = (policy: InsurancePolicy) => {
    const res = syncPolicyMembersToClientMaster(policy, clients);
    if (onUpdateClients) {
      onUpdateClients(res.updatedClients);
    }
    setSyncFeedback(`Synchronized ${res.newMembersAdded.length} new family member(s) into Client Master! Birthday alerts are now active.`);
    setTimeout(() => setSyncFeedback(null), 5000);
  };

  // Handle Bulk Sync All Policies
  const handleSyncAllPolicies = () => {
    let currentClients = [...clients];
    let totalAdded = 0;

    activeInsurancePolicies.forEach(pol => {
      const res = syncPolicyMembersToClientMaster(pol, currentClients);
      currentClients = res.updatedClients;
      totalAdded += res.newMembersAdded.length;
    });

    if (onUpdateClients) {
      onUpdateClients(currentClients);
    }
    setIsSyncDiffModalOpen(false);
    setSyncFeedback(`Successfully synchronized ${totalAdded} family member(s) across all policies into Client Master!`);
    setTimeout(() => setSyncFeedback(null), 5000);
  };

  // Handle Registering a Claim
  const handleRegisterClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClaimForm.policyId || !newClaimForm.claimantName || !newClaimForm.amount) {
      alert('Please fill all mandatory claim parameters.');
      return;
    }

    const matchedPolicy = activeInsurancePolicies.find(p => p.id === newClaimForm.policyId);
    const amountVal = parseFloat(newClaimForm.amount) || 0;

    const newClaim: PolicyClaim = {
      id: `clm_${Date.now()}`,
      policy_id: newClaimForm.policyId,
      policy_number: matchedPolicy?.policy_number || 'UNKNOWN',
      claim_number: `CLM/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`,
      date_of_incident: newClaimForm.incidentDate,
      date_intimated: new Date().toISOString().split('T')[0],
      claim_type: newClaimForm.claimType,
      claim_amount_requested: amountVal,
      claimant_name: newClaimForm.claimantName,
      claimant_relationship: 'Dependent',
      status: 'INTIMATED',
      hospital_garage_name: newClaimForm.hospitalGarage,
      remarks: newClaimForm.remarks,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setClaims(prev => [newClaim, ...prev]);
    setIsClaimModalOpen(false);
    setNewClaimForm({
      policyId: '',
      claimantName: '',
      incidentDate: new Date().toISOString().split('T')[0],
      claimType: 'CASHLESS',
      hospitalGarage: '',
      amount: '',
      remarks: ''
    });
    setSyncFeedback(`Claim ${newClaim.claim_number} successfully registered and dispatched to TPA.`);
    setTimeout(() => setSyncFeedback(null), 5000);
  };

  // Handle Recording an Underwriter Quote
  const handleRecordQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuoteForm.policyId || !newQuoteForm.competingInsurer || !newQuoteForm.quotedPremium) {
      alert('Please fill all required quote parameters.');
      return;
    }

    const matchedPolicy = activeInsurancePolicies.find(p => p.id === newQuoteForm.policyId);
    const quoteRecord: MarketQuoteComparison = {
      id: `cmp_${Date.now()}`,
      policy_id: newQuoteForm.policyId,
      vertical: matchedPolicy?.vertical || 'HEALTH',
      current_insurer: matchedPolicy?.insurer_name || '',
      current_sum_insured: matchedPolicy?.sum_insured || 0,
      current_premium: matchedPolicy?.net_premium || 0,
      alternative_insurer: newQuoteForm.competingInsurer,
      alternative_plan_name: newQuoteForm.planName || 'Standard Comprehensive Plan',
      quoted_sum_insured: parseFloat(newQuoteForm.quotedSumInsured) || matchedPolicy?.sum_insured || 0,
      quoted_premium: parseFloat(newQuoteForm.quotedPremium) || 0,
      features_difference: newQuoteForm.featuresDiff
        ? newQuoteForm.featuresDiff.split('\n').filter(s => s.trim().length > 0)
        : ['Direct Underwriter Binding Offer'],
      quote_source: newQuoteForm.quoteRef || 'Underwriter Broker Portal Reference',
      quote_date: new Date().toISOString().split('T')[0],
      status: 'PROPOSED'
    };

    setComparisons(prev => [quoteRecord, ...prev]);
    setIsQuoteModalOpen(false);
    setNewQuoteForm({
      policyId: '',
      competingInsurer: '',
      planName: '',
      quotedSumInsured: '',
      quotedPremium: '',
      quoteRef: '',
      featuresDiff: ''
    });
    setSyncFeedback(`Authenticated underwriter quotation from ${quoteRecord.alternative_insurer} saved successfully.`);
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
                Multi-vertical policy repository, OCR extraction intelligence, family floater birthday radar & 30-day renewal workflows.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsSyncDiffModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs md:text-sm flex items-center gap-2 border border-slate-200 shadow-xs transition-all cursor-pointer"
          >
            <Users className="w-4 h-4 text-rose-600" />
            <span>Review Family Sync Diff</span>
          </button>

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
          { id: 'members', label: `Family Floater & Birthdays (${stats.coveredMembersCount})` },
          { id: 'renewals', label: `Renewals Due (${stats.upcomingRenewalsCount})` },
          { id: 'claims', label: `Claims Desk & TPA (${claims.length})` },
          { id: 'comparison', label: `Portability & Quotes (${comparisons.length})` }
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
                  className="text-xs font-bold text-amber-800 hover:text-amber-900 underline flex items-center gap-1 cursor-pointer"
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
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-all inline-flex items-center gap-1"
                        >
                          <PhoneCall className="w-3 h-3" />
                          <span>Dispatch WhatsApp</span>
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
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
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
                className="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
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
                className="text-xs font-bold text-rose-700 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
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
                { id: 'COMMERCIAL_GENERAL', label: 'Commercial' },
                { id: 'HOME_PROPERTY', label: 'Home' },
                { id: 'TRAVEL', label: 'Travel' }
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

            {/* Search Input & Demo Clear Action */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search policy, client, car no..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-500 shadow-xs"
                />
              </div>

              {onClearDemoPolicies && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Are you sure you want to remove all synthetic demo policies? Authentic policies (like Niva Bupa & SBI General) and uploaded policies will remain intact.")) {
                      onClearDemoPolicies();
                    }
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors bg-white shadow-xs"
                  title="Purge synthetic sample policies while preserving genuine client policies"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span className="hidden sm:inline">Clear Demo Policies</span>
                </button>
              )}
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
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          Expires: <strong className="text-slate-700">{pol.expiry_date}</strong>
                        </span>
                        <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPolicyToEdit(pol);
                              setIsEditPolicyModalOpen(true);
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Edit Policy"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {onDeletePolicy && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPolicyToDelete(pol);
                              setIsDeleteConfirmOpen(true);
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete Policy"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
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

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSyncDiffModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                <span>Review Sync Diff ({syncQueueEvaluation.filter(i => i.status !== 'ALREADY_SYNCED').length} Pending)</span>
              </button>
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
                    .map(({ member, policy }) => {
                      const isChild = member.relationship_to_head === 'Son' || member.relationship_to_head === 'Daughter' || member.relationship_to_head === 'Child';
                      const waMsg = isChild
                        ? `Dear ${policy.client_name}, heartiest birthday congratulations to your ${member.relationship_to_head.toLowerCase()}, ${member.member_name}! Wishing them tremendous joy, robust health, and success ahead. Warm regards, AntFinServ.`
                        : `Dear ${member.member_name}, wishing you a very Happy Birthday! May the upcoming year bring you splendid health, prosperity, and joy. Best wishes, AntFinServ.`;
                      const waUrl = generateWhatsAppUrl(policy.proposer_mobile || '', waMsg);

                      return (
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
                          <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => {
                                handleSyncMembers(policy);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] border border-emerald-200 transition-all cursor-pointer"
                              title="Sync this family member to Client Master"
                            >
                              Sync Master
                            </button>
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-[11px] border border-rose-200 transition-all inline-flex items-center gap-1 cursor-pointer"
                              title="Send Birthday WhatsApp Greeting"
                            >
                              <Sparkles className="w-3 h-3 text-rose-600" />
                              <span>Birthday Wish</span>
                            </a>
                            <button
                              onClick={() => onNavigateToContentStudio?.('birthday')}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] border border-slate-300 transition-all cursor-pointer"
                              title="Open in Content Studio"
                            >
                              Content Studio
                            </button>
                          </td>
                        </tr>
                      );
                    })}
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

      {/* SUB-VIEW 5: CLAIMS DESK & TPA */}
      {activeSubTab === 'claims' && (
        <div className="space-y-5">
          {/* TPA Helplines Quick Access Strip */}
          <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2.5 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-emerald-400" />
                <span className="font-extrabold text-xs uppercase tracking-wider text-emerald-400">
                  24x7 Cashless Hospital & Garage TPA Helplines
                </span>
              </div>
              <span className="text-[10px] text-slate-400">Direct Emergency Response Desk</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-xs">
              <a href="tel:18004252255" className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700 block">
                <span className="text-[10px] text-slate-400 block font-semibold">Star Health Desk</span>
                <strong className="font-mono text-emerald-300">1800 425 2255</strong>
              </a>
              <a href="tel:18002666400" className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700 block">
                <span className="text-[10px] text-slate-400 block font-semibold">HDFC ERGO TPA</span>
                <strong className="font-mono text-emerald-300">1800 2666 400</strong>
              </a>
              <a href="tel:18602669966" className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700 block">
                <span className="text-[10px] text-slate-400 block font-semibold">Tata AIA Desk</span>
                <strong className="font-mono text-emerald-300">1860 266 9966</strong>
              </a>
              <a href="tel:18002666" className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700 block">
                <span className="text-[10px] text-slate-400 block font-semibold">ICICI Lombard</span>
                <strong className="font-mono text-emerald-300">1800 2666</strong>
              </a>
              <a href="tel:18001024488" className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700 block">
                <span className="text-[10px] text-slate-400 block font-semibold">Care Health Desk</span>
                <strong className="font-mono text-emerald-300">1800 102 4488</strong>
              </a>
            </div>
          </div>

          {/* Action Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Active & Settled Claims History</h3>
              <p className="text-xs text-slate-500">Track claim intimation, cashless approval status, deductions, and settlement records.</p>
            </div>
            <button
              onClick={() => setIsClaimModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Intimate / Register Claim</span>
            </button>
          </div>

          {/* Claims Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {claims.map(clm => (
              <div key={clm.id} className="glass-panel p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {clm.status}
                    </span>
                    <h4 className="font-extrabold text-slate-900 text-sm mt-1">{clm.claimant_name}</h4>
                    <p className="text-xs font-mono text-slate-500">{clm.claim_number}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Settled Amount</span>
                    <strong className="text-emerald-700 font-black text-base">
                      ₹{(clm.claim_amount_settled || clm.claim_amount_requested).toLocaleString('en-IN')}
                    </strong>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1 text-slate-600">
                  <div className="flex justify-between">
                    <span>Incident Date:</span>
                    <strong className="text-slate-900">{clm.date_of_incident}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Facility / Garage:</span>
                    <strong className="text-slate-900 line-clamp-1">{clm.hospital_garage_name}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>TPA Reference:</span>
                    <strong className="text-slate-900 font-mono">{clm.tpa_reference_number}</strong>
                  </div>
                  {clm.remarks && (
                    <div className="pt-1 text-[11px] text-slate-500 border-t border-slate-200">
                      {clm.remarks}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-VIEW 6: PORTABILITY & MARKET COMPARISON DESK */}
      {activeSubTab === 'comparison' && (
        <div className="space-y-5">
          {/* Statutory IRDAI Compliance Banner */}
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 space-y-1">
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-blue-700 flex-shrink-0" />
              <h4 className="font-extrabold text-sm text-blue-950">
                Statutory IRDAI Compliance & Zero-Hallucination Policy Mandate
              </h4>
            </div>
            <p className="text-xs text-blue-800 leading-relaxed">
              As an authorized AMFI & IRDAI distribution and advisory firm, AntFinServ strictly complies with non-hallucination standards. Algorithmic generation or simulated fabrication of fictitious insurance premiums is prohibited. Every comparative quote below is authenticated against verified underwriter binding schedules and dated carrier references.
            </p>
          </div>

          {/* Action Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Underwriter Sourced Quotation Reviews</h3>
              <p className="text-xs text-slate-500">Side-by-side feature portability analysis against active client policies.</p>
            </div>
            <button
              onClick={() => setIsQuoteModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Record Underwriter Quote</span>
            </button>
          </div>

          {/* Quotations List */}
          <div className="space-y-4">
            {comparisons.map(cmp => (
              <div key={cmp.id} className="glass-panel p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {cmp.vertical} PORTABILITY ANALYSIS
                    </span>
                    <h4 className="font-extrabold text-base text-slate-900 mt-1">
                      {cmp.current_insurer} ➔ {cmp.alternative_insurer}
                    </h4>
                    <p className="text-xs text-slate-500">{cmp.alternative_plan_name}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Source Reference</span>
                    <span className="text-xs font-mono font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {cmp.quote_source}
                    </span>
                  </div>
                </div>

                {/* Side by side stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-500">Current Expiring Plan</span>
                    <h5 className="font-bold text-sm text-slate-900">{cmp.current_insurer}</h5>
                    <div className="flex justify-between text-xs pt-1">
                      <span>Sum Insured:</span>
                      <strong>₹{cmp.current_sum_insured.toLocaleString('en-IN')}</strong>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Expiring Premium:</span>
                      <strong className="text-slate-800">₹{cmp.current_premium.toLocaleString('en-IN')}</strong>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-emerald-700">Underwriter Binding Quote</span>
                    <h5 className="font-bold text-sm text-emerald-950">{cmp.alternative_insurer}</h5>
                    <div className="flex justify-between text-xs pt-1">
                      <span>Offered Sum Insured:</span>
                      <strong className="text-emerald-900">₹{cmp.quoted_sum_insured.toLocaleString('en-IN')}</strong>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Quoted Premium:</span>
                      <strong className="text-emerald-700">₹{cmp.quoted_premium.toLocaleString('en-IN')}</strong>
                    </div>
                  </div>
                </div>

                {/* Distinct Value Addons */}
                <div>
                  <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Key Underwriting Advantage & Cover Enhancements
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {cmp.features_difference.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-slate-100 shadow-xs">
                        <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
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
                {selectedPolicy.proposer_name && selectedPolicy.proposer_name !== selectedPolicy.client_name && (
                  <p className="text-xs text-indigo-700 font-semibold mt-0.5">
                    Proposer: <span className="font-bold">{selectedPolicy.proposer_name}</span>
                  </p>
                )}
                <p className="text-xs text-slate-500 font-mono">{selectedPolicy.policy_number}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setPolicyToEdit(selectedPolicy);
                    setIsEditPolicyModalOpen(true);
                  }}
                  className="p-2 rounded-xl text-blue-600 hover:text-blue-800 hover:bg-blue-50 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                  title="Edit Policy Details"
                >
                  <Edit3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Edit</span>
                </button>
                {onDeletePolicy && (
                  <button
                    type="button"
                    onClick={() => {
                      setPolicyToDelete(selectedPolicy);
                      setIsDeleteConfirmOpen(true);
                    }}
                    className="p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                    title="Delete Policy"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                )}
                <button
                  onClick={() => setSelectedPolicy(null)}
                  className="text-slate-400 hover:text-slate-600 p-2 rounded-xl text-lg font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
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
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
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
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">
                          {m.is_primary_insured ? 'Primary' : 'Dependent'}
                        </span>
                        <button
                          onClick={() => onNavigateToContentStudio?.('birthday')}
                          className="p-1 rounded hover:bg-rose-50 text-rose-600"
                          title="Wish Birthday in Content Studio"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dynamic Vertical Specs */}
            {selectedPolicy.vertical_data && (
              <div className="space-y-2">
                <h4 className="font-bold text-xs text-slate-900">Vertical Policy Specifications</h4>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5 font-mono text-slate-700 max-h-60 overflow-y-auto">
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
              {onDeletePolicy && (
                <button
                  type="button"
                  onClick={() => {
                    setPolicyToDelete(selectedPolicy);
                    setIsDeleteConfirmOpen(true);
                  }}
                  className="py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-rose-200"
                  title="Delete this policy"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setPolicyToEdit(selectedPolicy);
                  setIsEditPolicyModalOpen(true);
                }}
                className="py-2.5 px-4 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-blue-200"
                title="Edit Policy Details"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit Details
              </button>
              <button
                onClick={() => setSelectedPolicy(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Close Drawer
              </button>
              <button
                onClick={() => handleSyncMembers(selectedPolicy)}
                className="flex-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Sync Family to Master & Birthdays
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POLICY DELETE CONFIRMATION MODAL */}
      {isDeleteConfirmOpen && policyToDelete && (
        <div className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-black text-slate-900">Delete Insurance Policy?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to permanently delete policy{' '}
                <strong className="text-slate-900 font-mono">#{policyToDelete.policy_number}</strong> for{' '}
                <strong className="text-slate-900">{policyToDelete.client_name}</strong> ({policyToDelete.insurer_name})?
              </p>
              <p className="text-[11px] text-rose-600 font-semibold mt-1">
                This will remove the policy from your Protection Vault and update all metrics.
              </p>
            </div>
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteConfirmOpen(false);
                  setPolicyToDelete(null);
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (policyToDelete) {
                    onDeletePolicy?.(policyToDelete.id);
                    if (selectedPolicy?.id === policyToDelete.id) {
                      setSelectedPolicy(null);
                    }
                    setSyncFeedback(`Policy #${policyToDelete.policy_number} deleted successfully.`);
                    setIsDeleteConfirmOpen(false);
                    setPolicyToDelete(null);
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm cursor-pointer transition-colors"
              >
                Yes, Delete Policy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MASTER CLIENT SYNC REVIEW & DIFF QUEUE MODAL */}
      {isSyncDiffModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl p-6 space-y-5 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Master Client Sync Review & Diff Queue
                  </h3>
                  <p className="text-xs text-slate-500">
                    Inspecting covered family members extracted from health floaters against Golden Client Master.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSyncDiffModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-3 pr-1">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                <strong className="text-slate-900">AMFI Zero Fake PAN Compliance:</strong> Minors and dependent members are assigned <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px] font-mono">pan: null</code>, inheriting the parent's phone number for automated Birthday Wishes in Content Studio.
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden text-xs">
                {syncQueueEvaluation.map((item, idx) => (
                  <div key={idx} className="p-3.5 bg-white flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-900 text-sm">{item.member.member_name}</strong>
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold text-[10px]">
                          {item.member.relationship_to_head}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        DOB: <span className="font-mono font-semibold text-slate-800">{item.member.dob}</span> | Family Head: <span className="font-semibold text-slate-800">{item.policy.client_name}</span> ({item.policy.proposer_mobile || 'No Mobile'})
                      </div>
                    </div>

                    <div>
                      {item.status === 'NEW_MEMBER' && (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] border border-emerald-200 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-emerald-600" />
                          <span>New Master Record</span>
                        </span>
                      )}
                      {item.status === 'DOB_ENRICHMENT' && (
                        <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px] border border-amber-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-amber-600" />
                          <span>Enrich Missing DOB</span>
                        </span>
                      )}
                      {item.status === 'ALREADY_SYNCED' && (
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-bold text-[11px] flex items-center gap-1">
                          <Check className="w-3 h-3 text-slate-400" />
                          <span>Already In Sync</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                onClick={() => setIsSyncDiffModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={handleSyncAllPolicies}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Confirm & Sync All Family Members</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REGISTER / INTIMATE CLAIM MODAL */}
      {isClaimModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-slate-900 text-base">Intimate / Register Insurance Claim</h3>
              </div>
              <button
                onClick={() => setIsClaimModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterClaim} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Insurance Policy *</label>
                <select
                  value={newClaimForm.policyId}
                  onChange={e => setNewClaimForm(prev => ({ ...prev, policyId: e.target.value }))}
                  required
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900"
                >
                  <option value="">-- Choose Policy --</option>
                  {activeInsurancePolicies.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.client_name} - {p.insurer_name} ({p.policy_number})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Claimant Name *</label>
                <input
                  type="text"
                  placeholder="e.g. PRIYA ARORA"
                  value={newClaimForm.claimantName}
                  onChange={e => setNewClaimForm(prev => ({ ...prev, claimantName: e.target.value }))}
                  required
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900"
                >
                </input>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Date of Incident *</label>
                  <input
                    type="date"
                    value={newClaimForm.incidentDate}
                    onChange={e => setNewClaimForm(prev => ({ ...prev, incidentDate: e.target.value }))}
                    required
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Claim Settlement Mode *</label>
                  <select
                    value={newClaimForm.claimType}
                    onChange={e => setNewClaimForm(prev => ({ ...prev, claimType: e.target.value as any }))}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900"
                  >
                    <option value="CASHLESS">Cashless Settlement</option>
                    <option value="REIMBURSEMENT">Reimbursement Claim</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Hospital / Cashless Garage</label>
                  <input
                    type="text"
                    placeholder="e.g. Fortis Hospital, Okhla"
                    value={newClaimForm.hospitalGarage}
                    onChange={e => setNewClaimForm(prev => ({ ...prev, hospitalGarage: e.target.value }))}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Estimated Claim Amount (₹) *</label>
                  <input
                    type="number"
                    placeholder="e.g. 150000"
                    value={newClaimForm.amount}
                    onChange={e => setNewClaimForm(prev => ({ ...prev, amount: e.target.value }))}
                    required
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Medical / Damage Diagnosis Remarks</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Emergency hospitalization, TPA intimation docket generated..."
                  value={newClaimForm.remarks}
                  onChange={e => setNewClaimForm(prev => ({ ...prev, remarks: e.target.value }))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsClaimModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md cursor-pointer"
                >
                  Save & Intimate Claim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD UNDERWRITER QUOTE MODAL */}
      {isQuoteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-slate-900 text-base">Record Authenticated Underwriter Quote</h3>
              </div>
              <button
                onClick={() => setIsQuoteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordQuote} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Client Policy *</label>
                <select
                  value={newQuoteForm.policyId}
                  onChange={e => setNewQuoteForm(prev => ({ ...prev, policyId: e.target.value }))}
                  required
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900"
                >
                  <option value="">-- Choose Existing Policy --</option>
                  {activeInsurancePolicies.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.client_name} - {p.insurer_name} ({p.vertical})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Competing Insurer *</label>
                  <input
                    type="text"
                    placeholder="e.g. HDFC ERGO General"
                    value={newQuoteForm.competingInsurer}
                    onChange={e => setNewQuoteForm(prev => ({ ...prev, competingInsurer: e.target.value }))}
                    required
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Plan / Variant Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Optima Secure Floater"
                    value={newQuoteForm.planName}
                    onChange={e => setNewQuoteForm(prev => ({ ...prev, planName: e.target.value }))}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Sum Insured (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 1500000"
                    value={newQuoteForm.quotedSumInsured}
                    onChange={e => setNewQuoteForm(prev => ({ ...prev, quotedSumInsured: e.target.value }))}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Quoted Premium (₹) *</label>
                  <input
                    type="number"
                    placeholder="e.g. 34200"
                    value={newQuoteForm.quotedPremium}
                    onChange={e => setNewQuoteForm(prev => ({ ...prev, quotedPremium: e.target.value }))}
                    required
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Underwriter / Portal Reference ID</label>
                <input
                  type="text"
                  placeholder="e.g. HDFC-UW-DEL-49210 or Agency Portal Ref"
                  value={newQuoteForm.quoteRef}
                  onChange={e => setNewQuoteForm(prev => ({ ...prev, quoteRef: e.target.value }))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Key Feature Differences (1 per line)</label>
                <textarea
                  rows={3}
                  placeholder="2X Secure Benefit (Effective ₹30L)&#10;Zero capping on Room Rent&#10;100% cumulative bonus"
                  value={newQuoteForm.featuresDiff}
                  onChange={e => setNewQuoteForm(prev => ({ ...prev, featuresDiff: e.target.value }))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsQuoteModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md cursor-pointer"
                >
                  Record Quotation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT POLICY MODAL */}
      {isEditPolicyModalOpen && (policyToEdit || selectedPolicy) && (
        <EditPolicyModal
          policy={policyToEdit || selectedPolicy!}
          isOpen={isEditPolicyModalOpen}
          onClose={() => {
            setIsEditPolicyModalOpen(false);
            setPolicyToEdit(null);
          }}
          onSave={handleSaveEditedPolicy}
        />
      )}
    </div>
  );
};