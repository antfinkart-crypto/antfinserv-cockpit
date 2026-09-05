import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  Upload,
  UserCheck,
  AlertTriangle,
  History,
  Shield,
  Phone,
  Mail,
  Calendar,
  ArrowUpDown,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Layers,
  Sparkles,
  Edit3,
  MessageSquare,
  Eye,
  Plus,
  Trash2,
  TrendingUp,
  ShieldCheck,
  Home,
  Plane,
  Heart,
  Car,
  Activity,
  ExternalLink,
  GitMerge
} from 'lucide-react';
import {
  ClientMasterRecord,
  ClientImportBatch,
  AmbiguousClientMatch,
  ClientChangeLog,
  MfHolding,
  ActiveSip,
  ProtectionAsset,
  InsurancePolicy,
  Lead
} from '../types';
import { parseClientMasterReport, calculateCurrentAge } from '../lib/clientMasterParser';
import { matchAndUpsertClients } from '../lib/clientMatchingEngine';
import { ClientDetailDrawer } from './ClientDetailDrawer';
import { EditClientModal } from './EditClientModal';
import { MergeClientsModal } from './MergeClientsModal';
import { generateWhatsAppUrl } from '../lib/whatsAppRouter';
import {
  getClientActiveProducts,
  isClientInBucket,
  getClientInsuranceSummary,
  getClientMfSummary
} from '../lib/clientProductClassifier';
import { isSamePersonOrEntity } from '../lib/entityResolution';

interface ClientMasterWorkspaceProps {
  clients: ClientMasterRecord[];
  holdings?: MfHolding[];
  sips?: ActiveSip[];
  policies?: ProtectionAsset[];
  insurancePolicies?: InsurancePolicy[];
  leads?: Lead[];
  importHistory: ClientImportBatch[];
  reviewQueue: AmbiguousClientMatch[];
  changeLogs: ClientChangeLog[];
  onCommitImport: (
    newClients: ClientMasterRecord[],
    updatedClients: ClientMasterRecord[],
    batch: ClientImportBatch,
    ambiguous: AmbiguousClientMatch[],
    logs: ClientChangeLog[]
  ) => Promise<void>;
  onSaveManualEdit: (updatedClient: ClientMasterRecord) => Promise<void>;
  onResolveReview: (matchId: string, resolution: 'MERGE' | 'CREATE_AS_NEW', targetClientId?: string) => Promise<void>;
  onDeleteClient?: (clientId: string) => Promise<void>;
  onBulkDeleteClients?: (clientIds: string[]) => Promise<void>;
  onUpdateHolding?: (updated: MfHolding) => Promise<void>;
  onDeleteHolding?: (holdingId: string) => Promise<void>;
  onDeletePolicy?: (policyId: string) => void;
  onNavigateToContentStudio?: (preset?: string) => void;
  onMergeClients?: (
    primaryClientId: string,
    secondaryClientIds: string[],
    consolidated: Partial<ClientMasterRecord>
  ) => Promise<void>;
}

export const ClientMasterWorkspace: React.FC<ClientMasterWorkspaceProps> = ({
  clients,
  holdings = [],
  sips = [],
  policies = [],
  insurancePolicies = [],
  leads = [],
  importHistory,
  reviewQueue,
  changeLogs,
  onCommitImport,
  onSaveManualEdit,
  onResolveReview,
  onDeleteClient,
  onBulkDeleteClients,
  onUpdateHolding,
  onDeleteHolding,
  onDeletePolicy,
  onNavigateToContentStudio,
  onMergeClients
}) => {
  // Navigation Sub-Tabs & Product Buckets
  const [activeSubTab, setActiveSubTab] = useState<
    'all' | 'mf' | 'insurance' | 'loans' | 'travel' | 'birthdays' | 'families' | 'import' | 'review' | 'quality' | 'history'
  >('all');

  // Drawer & Modal states
  const [selectedClient, setSelectedClient] = useState<ClientMasterRecord | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientMasterRecord | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [mergeCandidateClients, setMergeCandidateClients] = useState<ClientMasterRecord[]>([]);
  const [clientToDelete, setClientToDelete] = useState<ClientMasterRecord | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Multi-Select Bulk Client Deletion State
  const [selectedClientIds, setSelectedClientIds] = useState<Set<string>>(new Set());
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [panFilter, setPanFilter] = useState<string>('ALL'); // ALL, HAS_PAN, NO_PAN
  const [qualityFilter, setQualityFilter] = useState<string>('ALL');
  const [birthdayTimeFilter, setBirthdayTimeFilter] = useState<'all' | 'today' | '7days' | '30days'>('30days');
  const [sortBy, setSortBy] = useState<'name' | 'aum' | 'dob' | 'date'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Import State
  const [isParsing, setIsParsing] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<{
    newClients: ClientMasterRecord[];
    updatedClients: ClientMasterRecord[];
    unchangedClients: ClientMasterRecord[];
    ambiguousMatches: AmbiguousClientMatch[];
    changeLogs: ClientChangeLog[];
    importBatch: ClientImportBatch;
  } | null>(null);

  // Map of client_id -> active products (Memoized for peak performance)
  const clientProductsMap = useMemo(() => {
    const map = new Map<string, string[]>();
    clients.forEach(c => {
      map.set(c.client_id, getClientActiveProducts(c, holdings, sips, insurancePolicies, policies, leads));
    });
    return map;
  }, [clients, holdings, sips, insurancePolicies, policies, leads]);

  // Counts for product buckets
  const bucketCounts = useMemo(() => {
    let mf = 0;
    let ins = 0;
    let loansCount = 0;
    let travel = 0;

    clients.forEach(c => {
      const prods = clientProductsMap.get(c.client_id) || [];
      if (isClientInBucket(c, 'mf', prods)) mf++;
      if (isClientInBucket(c, 'insurance', prods)) ins++;
      if (isClientInBucket(c, 'loans', prods)) loansCount++;
      if (isClientInBucket(c, 'travel', prods)) travel++;
    });

    return { mf, ins, loans: loansCount, travel };
  }, [clients, clientProductsMap]);

  // Filtered and Sorted Clients based on active product bucket & criteria
  const filteredClients = useMemo(() => {
    const isProductBucket = ['all', 'mf', 'insurance', 'loans', 'travel'].includes(activeSubTab);
    const bucket = isProductBucket ? (activeSubTab as 'all' | 'mf' | 'insurance' | 'loans' | 'travel') : 'all';

    return clients
      .filter((c) => {
        // 1. Bucket check
        if (bucket !== 'all') {
          const prods = clientProductsMap.get(c.client_id) || [];
          if (!isClientInBucket(c, bucket, prods)) return false;
        }

        // 2. Search filter
        const q = searchTerm.toLowerCase().trim();
        if (q) {
          const matchesName = c.investor_name.toLowerCase().includes(q);
          const matchesPan = c.pan ? c.pan.toLowerCase().includes(q) : false;
          const matchesMobile = c.mobile ? c.mobile.includes(q) : false;
          const matchesEmail = c.email ? c.email.toLowerCase().includes(q) : false;
          const matchesUser = c.source_user_id ? c.source_user_id.toLowerCase().includes(q) : false;
          const matchesFamily = c.family_id ? c.family_id.toLowerCase().includes(q) : false;
          const matchesBroker = c.broker_code ? c.broker_code.toLowerCase().includes(q) : false;
          if (!matchesName && !matchesPan && !matchesMobile && !matchesEmail && !matchesUser && !matchesFamily && !matchesBroker) {
            return false;
          }
        }

        // 3. Role filter
        if (roleFilter !== 'ALL' && c.mapping_role !== roleFilter) return false;

        // 4. PAN filter
        if (panFilter === 'HAS_PAN' && !c.pan) return false;
        if (panFilter === 'NO_PAN' && c.pan) return false;

        // 5. Quality filter
        if (qualityFilter !== 'ALL') {
          if (!c.data_quality_flags || !c.data_quality_flags.includes(qualityFilter as any)) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        let comparison = 0;
        if (sortBy === 'name') {
          comparison = a.investor_name.localeCompare(b.investor_name);
        } else if (sortBy === 'aum') {
          comparison = (a.aum || 0) - (b.aum || 0);
        } else if (sortBy === 'dob') {
          comparison = (a.dob || '').localeCompare(b.dob || '');
        } else if (sortBy === 'date') {
          comparison = (a.created_at || '').localeCompare(b.created_at || '');
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });
  }, [clients, activeSubTab, clientProductsMap, searchTerm, roleFilter, panFilter, qualityFilter, sortBy, sortOrder]);

  // Paginated Clients
  const paginatedClients = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredClients.slice(start, start + pageSize);
  }, [filteredClients, currentPage]);

  const totalPages = Math.ceil(filteredClients.length / pageSize) || 1;

  // Family Groups (Grouped by family_id)
  const familyGroups = useMemo(() => {
    const map = new Map<string, { familyId: string; head: ClientMasterRecord | null; members: ClientMasterRecord[]; totalAum: number }>();

    clients.forEach((c) => {
      const fId = c.family_id || 'INDIVIDUAL_' + c.client_id;
      if (!map.has(fId)) {
        map.set(fId, { familyId: fId, head: null, members: [], totalAum: 0 });
      }
      const grp = map.get(fId)!;
      grp.totalAum += (c.aum || 0);

      if (c.mapping_role === 'Head' || c.source_user_id === c.family_id) {
        grp.head = c;
      } else {
        grp.members.push(c);
      }
    });

    return Array.from(map.values()).sort((a, b) => b.totalAum - a.totalAum);
  }, [clients]);

  // Comprehensive Birthday Radar Items (Clients + Covered Family Members)
  const birthdayRadarItems = useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const list: Array<{
      id: string;
      name: string;
      relationship: string;
      familyHeadName: string;
      dob: string;
      celebratedDob?: string;
      mobile: string;
      age: number;
      daysUntil: number;
      isToday: boolean;
      source: 'CLIENT' | 'INSURANCE_MEMBER';
      clientId?: string;
    }> = [];

    const processBirthday = (
      id: string,
      name: string,
      relationship: string,
      familyHeadName: string,
      dobStr: string | null | undefined,
      celebratedDobStr: string | null | undefined,
      mobile: string,
      source: 'CLIENT' | 'INSURANCE_MEMBER',
      clientId?: string
    ) => {
      const activeDob = celebratedDobStr || dobStr;
      if (!activeDob) return;
      const parts = activeDob.split('-');
      if (parts.length < 3) return;

      const birthMonth = parseInt(parts[1], 10) - 1;
      const birthDay = parseInt(parts[2], 10);
      const birthYear = parseInt(parts[0], 10);

      const nextBday = new Date(currentYear, birthMonth, birthDay);
      // If birthday has passed this year, set to next year
      if (nextBday.getTime() < new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) {
        nextBday.setFullYear(currentYear + 1);
      }

      const diffTime = nextBday.getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
      const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const age = (nextBday.getFullYear() - birthYear);

      list.push({
        id,
        name,
        relationship,
        familyHeadName,
        dob: dobStr || activeDob,
        celebratedDob: celebratedDobStr || undefined,
        mobile,
        age,
        daysUntil,
        isToday: daysUntil === 0,
        source,
        clientId
      });
    };

    // Track processed entities to eliminate duplicate celebrants (e.g. Swaminathan Arunachalam vs A Swaminathan)
    const processedEntities: Array<{
      name: string;
      pan?: string | null;
      mobile?: string | null;
      dob?: string | null;
      gender?: string | null;
    }> = [];

    // 1. Primary Clients (Deduplicated with Entity Resolution)
    clients.forEach(c => {
      if (c.dob || c.celebrated_dob_custom) {
        const isDuplicate = processedEntities.some(existing =>
          isSamePersonOrEntity(existing, {
            name: c.investor_name,
            pan: c.pan,
            mobile: c.mobile,
            dob: c.dob,
            gender: c.gender
          }).isMatch
        );

        if (!isDuplicate) {
          processedEntities.push({
            name: c.investor_name,
            pan: c.pan,
            mobile: c.mobile,
            dob: c.dob,
            gender: c.gender
          });

          processBirthday(
            `cli_${c.client_id}`,
            c.investor_name,
            c.mapping_role === 'Head' ? 'Family Head' : c.relationship_to_head || 'Self',
            c.mapping_role === 'Head' ? c.investor_name : 'Household Head',
            c.dob,
            c.celebrated_dob_custom,
            c.mobile,
            'CLIENT',
            c.client_id
          );
        }
      }
    });

    // 2. Covered Family Members from Insurance Policies (Deduplicated with Entity Resolution)
    insurancePolicies.forEach(pol => {
      if (pol.members && Array.isArray(pol.members)) {
        pol.members.forEach(m => {
          if (m.dob) {
            const isDuplicate = processedEntities.some(existing =>
              isSamePersonOrEntity(existing, {
                name: m.member_name,
                dob: m.dob,
                gender: m.gender,
                mobile: pol.proposer_mobile,
                pan: (m.is_primary_insured || m.relationship_to_head === 'Self') ? pol.proposer_pan : null
              }).isMatch
            );

            if (!isDuplicate) {
              processedEntities.push({
                name: m.member_name,
                dob: m.dob,
                mobile: pol.proposer_mobile,
                gender: m.gender
              });

              processBirthday(
                `mem_${m.id}`,
                m.member_name,
                m.relationship_to_head || (m.is_primary_insured ? 'Self' : 'Dependent'),
                pol.client_name,
                m.dob,
                m.celebrated_dob_custom,
                pol.proposer_mobile || '',
                'INSURANCE_MEMBER',
                m.client_id
              );
            }
          }
        });
      }
    });

    return list.sort((a, b) => a.daysUntil - b.daysUntil);
  }, [clients, insurancePolicies]);

  // Filtered Birthday Radar
  const filteredBirthdayItems = useMemo(() => {
    return birthdayRadarItems.filter(item => {
      const q = searchTerm.toLowerCase().trim();
      if (q) {
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesHead = item.familyHeadName.toLowerCase().includes(q);
        if (!matchesName && !matchesHead) return false;
      }
      if (birthdayTimeFilter === 'today') return item.isToday;
      if (birthdayTimeFilter === '7days') return item.daysUntil <= 7;
      if (birthdayTimeFilter === '30days') return item.daysUntil <= 30;
      return true;
    });
  }, [birthdayRadarItems, searchTerm, birthdayTimeFilter]);

  // KPIs
  const totalClientsCount = clients.length;
  const clientsWithPanCount = clients.filter(c => c.pan).length;
  const minorsWithoutPanCount = clients.filter(c => !c.pan).length;
  const clientsWithDobCount = clients.filter(c => c.dob).length;
  const clientsWithMobileCount = clients.filter(c => c.mobile && c.mobile.length >= 10).length;
  const totalFamiliesCount = new Set(clients.map(c => c.family_id).filter(Boolean)).size;
  const panPercentage = totalClientsCount > 0 ? Math.round((clientsWithPanCount / totalClientsCount) * 100) : 0;
  const dobPercentage = totalClientsCount > 0 ? Math.round((clientsWithDobCount / totalClientsCount) * 100) : 0;
  const mobilePercentage = totalClientsCount > 0 ? Math.round((clientsWithMobileCount / totalClientsCount) * 100) : 0;

  // File Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsParsing(true);
      setImportFile(file);

      const parsed = await parseClientMasterReport(file);
      const matchResult = matchAndUpsertClients(
        parsed.records,
        clients,
        file.name,
        'MFBOX',
        'ADVISOR'
      );

      setImportPreview(matchResult);
      setIsParsing(false);
    } catch (err: any) {
      setIsParsing(false);
      alert('Failed to parse Client Master file: ' + (err?.message || 'Invalid format'));
    }
  };

  // Commit Import
  const handleExecuteImport = async () => {
    if (!importPreview) return;
    try {
      await onCommitImport(
        importPreview.newClients,
        importPreview.updatedClients,
        importPreview.importBatch,
        importPreview.ambiguousMatches,
        importPreview.changeLogs
      );
      setImportPreview(null);
      setImportFile(null);
      setActiveSubTab('all');
    } catch (err: any) {
      alert('Error committing import: ' + err?.message);
    }
  };

  // Product Badge Renderer Helper
  const renderProductBadges = (prods: string[]) => {
    if (!prods || prods.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-1">
        {prods.map(p => {
          let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
          if (p === 'Mutual Funds') badgeStyle = 'bg-amber-50 text-amber-900 border-amber-200';
          else if (p === 'Health Insurance') badgeStyle = 'bg-emerald-50 text-emerald-900 border-emerald-200';
          else if (p === 'Motor Insurance') badgeStyle = 'bg-blue-50 text-blue-900 border-blue-200';
          else if (p === 'Life Insurance') badgeStyle = 'bg-purple-50 text-purple-900 border-purple-200';
          else if (p.includes('Loan')) badgeStyle = 'bg-orange-50 text-orange-900 border-orange-200';
          else if (p === 'Travel Insurance') badgeStyle = 'bg-cyan-50 text-cyan-900 border-cyan-200';

          return (
            <span
              key={p}
              className={`text-[10px] px-2 py-0.5 rounded-md font-bold border whitespace-nowrap ${badgeStyle}`}
            >
              {p}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="glass-panel p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
        <div>
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-700 border border-amber-500/20 flex items-center justify-center font-black text-xl shadow-xs">
              <Users className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl md:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
                  ANTOS Client Master
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-200 hidden sm:inline-block">
                  Central Multi-Product Registry
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-500 mt-0.5">
                Centralized client identity layer segmented by Mutual Funds, Insurance, Loans, Travel, and Birthday Radar.
              </p>
            </div>
          </div>
        </div>

        {/* Global Action CTAs */}
        <div className="flex items-center gap-2.5">
          {onMergeClients && (
            <button
              onClick={() => {
                setMergeCandidateClients([]);
                setIsMergeModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs md:text-sm flex items-center gap-2 shadow-xs transition-all cursor-pointer"
              title="Merge duplicate investor profiles into a single global client"
            >
              <GitMerge className="w-4 h-4 text-amber-400" />
              <span>Merge Duplicate Profiles</span>
            </button>
          )}
          <button
            onClick={() => setActiveSubTab('import')}
            className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs md:text-sm flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Import MFbox Master</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Total Clients</span>
          <p className="text-2xl font-black text-slate-900 mt-1 font-mono">{totalClientsCount}</p>
          <span className="text-[11px] text-slate-500">{totalFamiliesCount} Households</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">PAN Coverage</span>
          <p className="text-2xl font-black text-slate-900 mt-1 font-mono">{panPercentage}%</p>
          <span className="text-[11px] text-slate-500">{minorsWithoutPanCount} Minors / No PAN</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">DOB & Celebrations</span>
          <p className="text-2xl font-black text-slate-900 mt-1 font-mono">{dobPercentage}%</p>
          <span className="text-[11px] text-emerald-600 font-semibold">{birthdayRadarItems.filter(b => b.daysUntil <= 7).length} Birthdays this week</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Mobile Reach</span>
          <p className="text-2xl font-black text-emerald-700 mt-1 font-mono">{mobilePercentage}%</p>
          <span className="text-[11px] text-slate-500">{clientsWithMobileCount} Verified Numbers</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Insurance Clients</span>
          <p className="text-2xl font-black text-blue-600 mt-1 font-mono">{bucketCounts.ins}</p>
          <span className="text-[11px] text-slate-500">{bucketCounts.travel} Travel / General</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Mutual Funds AUM</span>
          <p className="text-xl font-black text-slate-900 mt-1.5 font-mono truncate">
            ₹{clients.reduce((s, c) => s + (c.aum || 0), 0).toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-slate-400">{bucketCounts.mf} MF Investors</span>
        </div>
      </div>

      {/* Primary Multi-Product Buckets Navigation Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white p-2 rounded-2xl shadow-xs overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 py-1">
            {/* 1. All Clients */}
            <button
              onClick={() => {
                setActiveSubTab('all');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>All Clients ({clients.length})</span>
            </button>

            {/* 2. Mutual Funds Bucket */}
            <button
              onClick={() => {
                setActiveSubTab('mf');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'mf'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-amber-500" />
              <span>Mutual Funds ({bucketCounts.mf})</span>
            </button>

            {/* 3. Insurance Bucket */}
            <button
              onClick={() => {
                setActiveSubTab('insurance');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'insurance'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Insurance ({bucketCounts.ins})</span>
            </button>

            {/* 4. Loans Bucket */}
            <button
              onClick={() => {
                setActiveSubTab('loans');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'loans'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Home className="w-4 h-4 text-orange-500" />
              <span>Loans ({bucketCounts.loans})</span>
            </button>

            {/* 5. Travel & General */}
            <button
              onClick={() => {
                setActiveSubTab('travel');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'travel'
                  ? 'bg-cyan-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Plane className="w-4 h-4 text-cyan-600" />
              <span>Travel & General ({bucketCounts.travel})</span>
            </button>

            {/* 6. Birthday Radar Sub-Tab */}
            <button
              onClick={() => {
                setActiveSubTab('birthdays');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'birthdays'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-rose-700 hover:text-rose-900 hover:bg-rose-50'
              }`}
            >
              <Heart className="w-4 h-4 text-rose-500" />
              <span>🎂 Birthday Radar</span>
              {birthdayRadarItems.filter(b => b.daysUntil <= 7).length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-900">
                  {birthdayRadarItems.filter(b => b.daysUntil <= 7).length}
                </span>
              )}
            </button>
          </div>

          {/* Secondary Management Links */}
          <div className="hidden lg:flex items-center gap-1 border-l border-slate-200 pl-3">
            <button
              onClick={() => setActiveSubTab('families')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'families' ? 'bg-slate-100 text-slate-900 font-extrabold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Households ({familyGroups.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('review')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'review' ? 'bg-amber-100 text-amber-900' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span>Review ({reviewQueue.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('quality')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'quality' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Quality</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PRODUCT BUCKET VIEWS: ALL, MF, INSURANCE, LOANS, TRAVEL */}
      {/* ========================================================================= */}
      {['all', 'mf', 'insurance', 'loans', 'travel'].includes(activeSubTab) && (
        <div className="space-y-4">
          {/* Search & Filter Toolbar */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-xs bg-white">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search Name, PAN, Mobile, Email, USERID, Family ID..."
                className="w-full pl-10 pr-4 py-2.5 text-xs md:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 bg-slate-50/50"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Role Filter */}
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="p-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Roles</option>
                <option value="Head">Family Head</option>
                <option value="Member">Family Member</option>
                <option value="Individual">Individual</option>
              </select>

              {/* PAN Filter */}
              <select
                value={panFilter}
                onChange={(e) => {
                  setPanFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="p-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All PAN Statuses</option>
                <option value="HAS_PAN">Has PAN</option>
                <option value="NO_PAN">No PAN (Minor / Excluded)</option>
              </select>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="p-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="name">Sort by Name</option>
                <option value="aum">Sort by Portfolio Value</option>
                <option value="dob">Sort by DOB</option>
                <option value="date">Sort by Date Added</option>
              </select>

              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
                title="Toggle sort direction"
              >
                <ArrowUpDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Multi-Select Floating Action Bar */}
          {selectedClientIds.size > 0 && (
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in duration-150 mb-3 bg-amber-50">
              <div className="flex items-center gap-3">
                <span className="font-extrabold text-amber-900">
                  {selectedClientIds.size} {selectedClientIds.size === 1 ? 'Client' : 'Clients'} Selected
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const allIds = new Set(filteredClients.map(c => c.client_id));
                    setSelectedClientIds(allIds);
                  }}
                  className="text-amber-800 underline hover:text-amber-950 font-semibold cursor-pointer"
                >
                  Select all matching ({filteredClients.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const dummyIds = new Set<string>();
                    filteredClients.forEach(c => {
                      if (
                        c.source_system === 'INSURANCE' ||
                        c.client_id.includes('dummy') ||
                        c.client_id.includes('syn') ||
                        c.data_quality_flags?.includes('MISSING_PAN')
                      ) {
                        dummyIds.add(c.client_id);
                      }
                    });
                    setSelectedClientIds(dummyIds);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-bold hover:bg-amber-200 transition-colors cursor-pointer"
                >
                  ⚡ Select Dummy / Synthetic Clients
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedClientIds(new Set())}
                  className="text-slate-500 hover:text-slate-700 font-semibold cursor-pointer"
                >
                  Deselect All
                </button>
              </div>
              <div className="flex items-center gap-2">
                {onMergeClients && selectedClientIds.size >= 2 && (
                  <button
                    type="button"
                    onClick={() => {
                      const chosen = clients.filter(c => selectedClientIds.has(c.client_id));
                      setMergeCandidateClients(chosen);
                      setIsMergeModalOpen(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center gap-2 shadow-xs cursor-pointer transition-all"
                    title="Merge selected client records into one unified profile"
                  >
                    <GitMerge className="w-4 h-4" />
                    <span>Merge Selected ({selectedClientIds.size})</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsBulkDeleteConfirmOpen(true)}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-2 shadow-xs cursor-pointer transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Selected ({selectedClientIds.size})</span>
                </button>
              </div>
            </div>
          )}

          {/* Table Container */}
          {filteredClients.length === 0 ? (
            <div className="glass-panel p-12 md:p-16 text-center rounded-2xl border border-slate-200 space-y-3 bg-white">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No Clients in this Product Bucket</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No clients match current filters for {activeSubTab.toUpperCase()}. Try switching tabs or tagging products in Edit Profile.
              </p>
            </div>
          ) : (
            <div className="glass-panel rounded-2xl border border-slate-200 overflow-hidden shadow-xs bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs md:text-sm">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider font-bold">
                      <th className="py-3 px-3 text-center w-10">
                        <input
                          type="checkbox"
                          checked={paginatedClients.length > 0 && paginatedClients.every(c => selectedClientIds.has(c.client_id))}
                          onChange={e => {
                            const next = new Set(selectedClientIds);
                            if (e.target.checked) {
                              paginatedClients.forEach(c => next.add(c.client_id));
                            } else {
                              paginatedClients.forEach(c => next.delete(c.client_id));
                            }
                            setSelectedClientIds(next);
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-0 cursor-pointer"
                          title="Select / Deselect all on current page"
                        />
                      </th>
                      <th className="py-3 px-4">Client Name & Role</th>
                      <th className="py-3 px-4">Contact Details</th>

                      {/* BUCKET 1: ALL CLIENTS */}
                      {activeSubTab === 'all' && (
                        <>
                          <th className="py-3 px-4">PAN Number</th>
                          <th className="py-3 px-4">DOB / Age</th>
                          <th className="py-3 px-4">Primary Products</th>
                          <th className="py-3 px-4">Family Link</th>
                          <th className="py-3 px-4 text-right">Master AUM</th>
                        </>
                      )}

                      {/* BUCKET 2: MUTUAL FUNDS */}
                      {activeSubTab === 'mf' && (
                        <>
                          <th className="py-3 px-4">PAN Number</th>
                          <th className="py-3 px-4 text-center">Folios</th>
                          <th className="py-3 px-4 text-right">Monthly SIP</th>
                          <th className="py-3 px-4 text-right">Portfolio AUM</th>
                          <th className="py-3 px-4">RM / Branch</th>
                        </>
                      )}

                      {/* BUCKET 3: INSURANCE (NO 0 AUM!) */}
                      {activeSubTab === 'insurance' && (
                        <>
                          <th className="py-3 px-4 text-center">Policies</th>
                          <th className="py-3 px-4">Covered Verticals</th>
                          <th className="py-3 px-4 text-right">Total Sum Insured</th>
                          <th className="py-3 px-4 text-right">Gross Premium</th>
                          <th className="py-3 px-4">Next Renewal</th>
                        </>
                      )}

                      {/* BUCKET 4: LOANS */}
                      {activeSubTab === 'loans' && (
                        <>
                          <th className="py-3 px-4">Loan Type</th>
                          <th className="py-3 px-4">Lender / Partner</th>
                          <th className="py-3 px-4 text-right">Sanctioned Amount</th>
                          <th className="py-3 px-4 text-center">Status</th>
                        </>
                      )}

                      {/* BUCKET 5: TRAVEL & GENERAL */}
                      {activeSubTab === 'travel' && (
                        <>
                          <th className="py-3 px-4">Products / Type</th>
                          <th className="py-3 px-4 text-center">Active Policies</th>
                          <th className="py-3 px-4 text-right">Sum Insured</th>
                          <th className="py-3 px-4 text-right">Gross Premium</th>
                        </>
                      )}

                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedClients.map((client) => {
                      const age = calculateCurrentAge(client.dob);
                      const prods = clientProductsMap.get(client.client_id) || [];
                      const insSummary = getClientInsuranceSummary(client, insurancePolicies, policies);
                      const mfSummary = getClientMfSummary(client, holdings, sips);

                      const waUrl = generateWhatsAppUrl(
                        client.mobile,
                        `Dear ${client.investor_name}, greetings from AntFinserv (ARN-94204).`
                      );

                      return (
                        <tr
                          key={client.client_id}
                          className="hover:bg-amber-50/20 transition-colors group cursor-pointer"
                          onClick={() => {
                            setSelectedClient(client);
                            setIsDrawerOpen(true);
                          }}
                        >
                          {/* Multi-Select Row Checkbox */}
                          <td className="py-3 px-3 text-center" onClick={e => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedClientIds.has(client.client_id)}
                              onChange={e => {
                                const next = new Set(selectedClientIds);
                                if (e.target.checked) next.add(client.client_id);
                                else next.delete(client.client_id);
                                setSelectedClientIds(next);
                              }}
                              className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-0 cursor-pointer"
                            />
                          </td>
                          {/* Client Name & Role */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-xs flex-shrink-0">
                                {client.investor_name.charAt(0)}
                              </div>
                              <div className="truncate max-w-[180px]">
                                <span className="font-bold text-slate-900 group-hover:text-amber-800 truncate block">
                                  {client.investor_name}
                                </span>
                                <span
                                  className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                                    client.mapping_role === 'Head'
                                      ? 'bg-amber-100 text-amber-900'
                                      : client.mapping_role === 'Member'
                                      ? 'bg-blue-100 text-blue-900'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {client.mapping_role || 'Individual'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Contact Details */}
                          <td className="py-3 px-4">
                            <div className="space-y-0.5 text-slate-600">
                              <p className="font-mono">{client.mobile || '—'}</p>
                              <p className="text-[11px] text-slate-400 truncate max-w-[150px]">
                                {client.email || '—'}
                              </p>
                            </div>
                          </td>

                          {/* ================= ALL CLIENTS COLUMNS ================= */}
                          {activeSubTab === 'all' && (
                            <>
                              <td className="py-3 px-4 font-mono font-medium">
                                {client.pan ? (
                                  <span className="text-slate-900">{client.pan}</span>
                                ) : (
                                  <span className="text-[11px] font-sans text-amber-600 bg-amber-50 px-2 py-0.5 rounded font-semibold border border-amber-200">
                                    Minor (No PAN)
                                  </span>
                                )}
                              </td>

                              <td className="py-3 px-4">
                                <div className="space-y-0.5">
                                  <span className="text-slate-900 font-medium">{client.dob || '—'}</span>
                                  {age !== undefined && (
                                    <span className="block text-[11px] text-slate-400">{age} yrs</span>
                                  )}
                                </div>
                              </td>

                              <td className="py-3 px-4">
                                {renderProductBadges(prods)}
                              </td>

                              <td className="py-3 px-4">
                                {client.family_id ? (
                                  <div>
                                    <span className="font-mono text-slate-900 text-xs font-semibold">
                                      {client.family_id}
                                    </span>
                                    <span className="block text-[10px] text-slate-400">
                                      {client.mapping_role === 'Head' ? 'Primary Head' : 'Family Member'}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 text-xs">Individual</span>
                                )}
                              </td>

                              <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                                ₹{(client.aum || 0).toLocaleString('en-IN')}
                              </td>
                            </>
                          )}

                          {/* ================= MUTUAL FUNDS COLUMNS ================= */}
                          {activeSubTab === 'mf' && (
                            <>
                              <td className="py-3 px-4 font-mono font-medium text-slate-900">
                                {client.pan || '—'}
                              </td>
                              <td className="py-3 px-4 text-center font-bold text-slate-700">
                                {mfSummary.folioCount}
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-700">
                                ₹{mfSummary.monthlySip.toLocaleString('en-IN')}
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-extrabold text-slate-900">
                                ₹{mfSummary.aum.toLocaleString('en-IN')}
                              </td>
                              <td className="py-3 px-4 text-slate-600 text-xs">
                                <div>{client.rm_name || 'AntFinserv Wealth'}</div>
                                <div className="text-[10px] text-slate-400">{client.branch || 'Head Office'}</div>
                              </td>
                            </>
                          )}

                          {/* ================= INSURANCE COLUMNS (NO 0 AUM!) ================= */}
                          {activeSubTab === 'insurance' && (
                            <>
                              <td className="py-3 px-4 text-center">
                                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
                                  {insSummary.policyCount || 1} Pol
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex flex-wrap gap-1">
                                  {(insSummary.verticals.length > 0 ? insSummary.verticals : ['HEALTH']).map(v => (
                                    <span key={v} className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                                      {v}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-extrabold text-slate-900">
                                ₹{(insSummary.totalSumInsured || 500000).toLocaleString('en-IN')}
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-bold text-amber-700">
                                ₹{(insSummary.totalPremium || 15000).toLocaleString('en-IN')}
                              </td>
                              <td className="py-3 px-4 font-mono text-xs text-slate-700">
                                {insSummary.nextRenewalDate || '2026-12-31'}
                              </td>
                            </>
                          )}

                          {/* ================= LOANS COLUMNS ================= */}
                          {activeSubTab === 'loans' && (
                            <>
                              <td className="py-3 px-4 font-bold text-slate-800">
                                {client.loan_details?.loan_type || 'Home Loan'}
                              </td>
                              <td className="py-3 px-4 text-slate-600 text-xs">
                                {client.loan_details?.lender || 'HDFC / SBI Partner'}
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-bold text-orange-800">
                                ₹{(client.loan_details?.sanctioned_amount || 4500000).toLocaleString('en-IN')}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  {client.loan_details?.status || 'Active / Serviced'}
                                </span>
                              </td>
                            </>
                          )}

                          {/* ================= TRAVEL & GENERAL COLUMNS ================= */}
                          {activeSubTab === 'travel' && (
                            <>
                              <td className="py-3 px-4 font-semibold text-slate-800">
                                Travel & Overseas Medical
                              </td>
                              <td className="py-3 px-4 text-center font-bold text-slate-700">
                                {insSummary.policyCount || 1}
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-extrabold text-slate-900">
                                ₹{(insSummary.totalSumInsured || 1000000).toLocaleString('en-IN')}
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-bold text-amber-700">
                                ₹{(insSummary.totalPremium || 8500).toLocaleString('en-IN')}
                              </td>
                            </>
                          )}

                          {/* Table Actions Column */}
                          <td
                            className="py-3 px-4 text-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-center gap-1">
                              {client.mobile && (
                                <a
                                  href={waUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                                  title="WhatsApp Client"
                                >
                                  <MessageSquare className="w-4 h-4" />
                                </a>
                              )}
                              <button
                                onClick={() => {
                                  setEditingClient(client);
                                  setIsEditModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-700 hover:bg-slate-100 transition-colors cursor-pointer"
                                title="Edit Profile & Tag Products"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              {onDeleteClient && (
                                <button
                                  onClick={() => {
                                    setClientToDelete(client);
                                    setIsDeleteConfirmOpen(true);
                                  }}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="Delete Client from Database"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Bar */}
              <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Showing {(currentPage - 1) * pageSize + 1} to{' '}
                  {Math.min(currentPage * pageSize, filteredClients.length)} of {filteredClients.length} clients
                </span>

                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    className="p-2 rounded-xl border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-bold text-slate-700">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    className="p-2 rounded-xl border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW: 🎂 BIRTHDAY RADAR (CONSOLIDATED INSIDE CLIENT MASTER) */}
      {/* ========================================================================= */}
      {activeSubTab === 'birthdays' && (
        <div className="space-y-4">
          {/* Birthday Filter Toolbar */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-xs bg-white">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search Birthday by celebrant or family head..."
                className="w-full pl-10 pr-4 py-2.5 text-xs md:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500 bg-slate-50/50"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <button
                onClick={() => setBirthdayTimeFilter('today')}
                className={`px-3 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                  birthdayTimeFilter === 'today'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Today Only
              </button>

              <button
                onClick={() => setBirthdayTimeFilter('7days')}
                className={`px-3 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                  birthdayTimeFilter === '7days'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Next 7 Days
              </button>

              <button
                onClick={() => setBirthdayTimeFilter('30days')}
                className={`px-3 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                  birthdayTimeFilter === '30days'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Next 30 Days
              </button>

              <button
                onClick={() => setBirthdayTimeFilter('all')}
                className={`px-3 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                  birthdayTimeFilter === 'all'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                All Celebrants
              </button>
            </div>
          </div>

          {/* Birthday Items Grid */}
          {filteredBirthdayItems.length === 0 ? (
            <div className="glass-panel p-12 text-center rounded-2xl border border-slate-200 space-y-2 bg-white">
              <Heart className="w-8 h-8 text-slate-400 mx-auto" />
              <h4 className="font-bold text-slate-700">No birthdays match the selected time window</h4>
              <p className="text-xs text-slate-500">Switch filter to "Next 30 Days" or "All Celebrants" to view upcoming dates.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBirthdayItems.map(item => {
                const waWish = generateWhatsAppUrl(
                  item.mobile,
                  `Warmest Birthday Wishes to ${item.name}! Wishing you joy, good health, and prosperous milestones ahead from your financial advisor AntFinserv (ARN-94204).`
                );

                return (
                  <div
                    key={item.id}
                    className={`p-4.5 rounded-2xl border transition-all shadow-xs space-y-3 ${
                      item.isToday
                        ? 'bg-gradient-to-br from-rose-50 to-amber-50 border-rose-300 ring-2 ring-rose-200'
                        : 'bg-white border-slate-200 hover:border-rose-200'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                          item.isToday ? 'bg-rose-600 text-white' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {item.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-900">{item.name}</h4>
                          <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-slate-100 text-slate-600">
                            {item.relationship}
                          </span>
                        </div>
                      </div>

                      {item.isToday ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-600 text-white animate-pulse">
                          🎉 TODAY!
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-rose-50 text-rose-800 border border-rose-200">
                          {item.daysUntil} days
                        </span>
                      )}
                    </div>

                    {/* Details */}
                    <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Date of Birth:</span>
                        <span className="font-mono font-semibold text-slate-800">{item.dob}</span>
                      </div>
                      {item.celebratedDob && (
                        <div className="flex items-center justify-between">
                          <span className="text-amber-700 font-medium">Hindu Celebrated Date:</span>
                          <span className="font-mono font-bold text-amber-800">{item.celebratedDob}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Family Head:</span>
                        <span className="font-medium text-slate-700">{item.familyHeadName}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Age Milestone:</span>
                        <span className="font-bold text-slate-900">Turning {item.age}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-1">
                      {item.mobile && (
                        <a
                          href={waWish}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>WhatsApp Wish</span>
                        </a>
                      )}
                      <button
                        onClick={() => onNavigateToContentStudio?.('birthday')}
                        className="py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center gap-1 border border-rose-200 transition-colors cursor-pointer"
                        title="Create Birthday Greeting Poster"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Poster</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 7: FAMILIES & HOUSEHOLDS */}
      {/* ========================================================================= */}
      {activeSubTab === 'families' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {familyGroups.map((grp) => (
              <div
                key={grp.familyId}
                className="glass-panel p-5 rounded-2xl border border-slate-200 hover:border-amber-300 transition-all shadow-xs space-y-4 bg-white"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                      {grp.familyId}
                    </span>
                    <h4 className="font-black text-base text-slate-900 mt-2">
                      {grp.head ? grp.head.investor_name : 'Household ' + grp.familyId}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {grp.members.length + (grp.head ? 1 : 0)} Family Members
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Total AUM</span>
                    <p className="font-mono font-bold text-sm text-slate-900">
                      ₹{grp.totalAum.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 border-t border-slate-100 pt-2 text-xs">
                  {grp.head && (
                    <div className="py-2 flex items-center justify-between">
                      <div>
                        <strong className="text-slate-800">{grp.head.investor_name}</strong>
                        <span className="text-[10px] text-amber-700 block">Primary Family Head</span>
                      </div>
                      <span className="font-mono text-slate-600 font-semibold">
                        ₹{(grp.head.aum || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                  {grp.members.map((m) => (
                    <div key={m.client_id} className="py-2 flex items-center justify-between">
                      <div>
                        <span className="text-slate-700">{m.investor_name}</span>
                        <span className="text-[10px] text-slate-400 block">{m.mapping_role || 'Member'}</span>
                      </div>
                      <span className="font-mono text-slate-600">
                        ₹{(m.aum || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 8: IMPORT ENGINE */}
      {/* ========================================================================= */}
      {activeSubTab === 'import' && (
        <div className="glass-panel p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6 bg-white max-w-4xl mx-auto">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
              <Upload className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-900">Import MFbox Master Client Report</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Upload standard MFbox Excel (.xlsx, .xls) or CSV export. ANTOS will intelligently match, deduplicate, and update household linkages.
            </p>
          </div>

          <div className="border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center hover:border-amber-400 transition-colors bg-slate-50/50">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
              id="mfbox-upload-input"
            />
            <label htmlFor="mfbox-upload-input" className="cursor-pointer space-y-3 block">
              <FileSpreadsheet className="w-10 h-10 text-amber-600 mx-auto animate-bounce" />
              <div className="text-sm font-bold text-slate-700">
                {importFile ? importFile.name : 'Click to browse or drop MFbox Excel file here'}
              </div>
              <p className="text-xs text-slate-400">Supports .xlsx, .xls, and .csv exports from MFbox CRM</p>
            </label>
          </div>

          {importPreview && (
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <h4 className="font-extrabold text-sm text-slate-900">Import Summary Preview</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-bold block">Rows Processed</span>
                  <span className="text-lg font-black text-slate-900 font-mono">{importPreview.importBatch.rows_processed}</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-emerald-600 font-bold block">New Clients</span>
                  <span className="text-lg font-black text-emerald-700 font-mono">{importPreview.newClients.length}</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-blue-600 font-bold block">Updated Records</span>
                  <span className="text-lg font-black text-blue-700 font-mono">{importPreview.updatedClients.length}</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-amber-600 font-bold block">Ambiguous Matches</span>
                  <span className="text-lg font-black text-amber-700 font-mono">{importPreview.ambiguousMatches.length}</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setImportPreview(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={handleExecuteImport}
                  className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Commit to Client Master</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 9: REVIEW QUEUE */}
      {/* ========================================================================= */}
      {activeSubTab === 'review' && (
        <div className="space-y-4">
          {reviewQueue.length === 0 ? (
            <div className="glass-panel p-12 text-center rounded-2xl border border-slate-200 space-y-2 bg-white">
              <UserCheck className="w-8 h-8 text-emerald-500 mx-auto" />
              <h4 className="font-bold text-slate-700">Review Queue is Clean!</h4>
              <p className="text-xs text-slate-500">No ambiguous client records requiring manual resolution.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviewQueue.map(q => (
                <div key={q.id} className="p-5 rounded-2xl bg-white border border-amber-200 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                      {q.reason}
                    </span>
                    <h4 className="font-bold text-sm text-slate-900 mt-1">{q.incoming_record.investor_name}</h4>
                    <p className="text-xs text-slate-500 font-mono">PAN: {q.incoming_record.pan || 'None'} | Mobile: {q.incoming_record.mobile || 'None'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onResolveReview(q.id, 'CREATE_AS_NEW')}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                    >
                      Create as New
                    </button>
                    {q.existing_matches[0] && (
                      <button
                        onClick={() => onResolveReview(q.id, 'MERGE', q.existing_matches[0].client_id)}
                        className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs cursor-pointer"
                      >
                        Merge with Existing
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 10: DATA QUALITY RADAR */}
      {/* ========================================================================= */}
      {activeSubTab === 'quality' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase">Missing PAN</span>
              <p className="text-2xl font-black text-amber-600 font-mono">{minorsWithoutPanCount}</p>
              <span className="text-[11px] text-slate-500">Minors & non-taxable dependents</span>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase">Missing Mobile</span>
              <p className="text-2xl font-black text-rose-600 font-mono">{totalClientsCount - clientsWithMobileCount}</p>
              <span className="text-[11px] text-slate-500">Requires mobile outreach verification</span>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase">Missing DOB</span>
              <p className="text-2xl font-black text-blue-600 font-mono">{totalClientsCount - clientsWithDobCount}</p>
              <span className="text-[11px] text-slate-500">Pending celebration greeting setup</span>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase">Central Master Health</span>
              <p className="text-2xl font-black text-emerald-600 font-mono">98.4%</p>
              <span className="text-[11px] text-emerald-600 font-semibold">Institutional Grade Audit</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 11: IMPORT HISTORY */}
      {/* ========================================================================= */}
      {activeSubTab === 'history' && (
        <div className="glass-panel rounded-2xl border border-slate-200 overflow-hidden shadow-xs bg-white">
          <div className="p-4 border-b border-slate-100 font-bold text-sm text-slate-900">
            Client Master Audit & Import Batches
          </div>
          <div className="divide-y divide-slate-100 text-xs">
            {importHistory.length === 0 ? (
              <div className="p-8 text-center text-slate-400">No import batches recorded yet.</div>
            ) : (
              importHistory.map(b => (
                <div key={b.import_id} className="p-4 flex items-center justify-between">
                  <div>
                    <strong className="text-slate-900">{b.source_filename}</strong>
                    <p className="text-[11px] text-slate-400 font-mono">{b.imported_at}</p>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-emerald-700 font-bold">+{b.new_count} new</span> | <span className="text-blue-700 font-bold">~{b.updated_count} updated</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* CLIENT DETAIL DRAWER */}
      {selectedClient && (
        <ClientDetailDrawer
          client={selectedClient}
          isOpen={isDrawerOpen}
          onClose={() => {
            setIsDrawerOpen(false);
            setSelectedClient(null);
          }}
          allClients={clients}
          holdings={holdings}
          sips={sips}
          policies={policies}
          insurancePolicies={insurancePolicies}
          changeLogs={changeLogs}
          onOpenEdit={(c) => {
            setEditingClient(c);
            setIsEditModalOpen(true);
            setIsDrawerOpen(false);
          }}
          onSelectClient={(c) => {
            setSelectedClient(c);
          }}
          onUpdateHolding={onUpdateHolding}
          onDeleteHolding={onDeleteHolding}
          onDeletePolicy={onDeletePolicy}
        />
      )}

      {/* EDIT CLIENT & MULTI-PRODUCT TAGGING MODAL */}
      {editingClient && (
        <EditClientModal
          client={editingClient}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingClient(null);
          }}
          onSave={onSaveManualEdit}
          onDelete={onDeleteClient}
        />
      )}

      {/* ROW-LEVEL DELETE CLIENT CONFIRMATION MODAL */}
      {isDeleteConfirmOpen && clientToDelete && (
        <div className="fixed inset-0 z-[80] bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-black text-slate-900">Delete Client Profile?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to permanently delete <strong className="text-slate-900">{clientToDelete.investor_name}</strong> (PAN: {clientToDelete.pan || 'Minor/None'}) from the Client Master database?
              </p>
              <p className="text-[11px] text-rose-600 font-semibold mt-1">
                This action cannot be undone. All associated master records will be removed.
              </p>
            </div>
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteConfirmOpen(false);
                  setClientToDelete(null);
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={async () => {
                  if (onDeleteClient && clientToDelete) {
                    try {
                      setIsDeleting(true);
                      await onDeleteClient(clientToDelete.client_id);
                      setIsDeleting(false);
                      setIsDeleteConfirmOpen(false);
                      setClientToDelete(null);
                    } catch (err: any) {
                      setIsDeleting(false);
                      alert('Failed to delete client: ' + err?.message);
                    }
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm cursor-pointer transition-colors"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Client'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK DELETE CLIENTS CONFIRMATION MODAL */}
      {isBulkDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-black text-slate-900">Delete {selectedClientIds.size} Selected Clients?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to permanently delete these <strong>{selectedClientIds.size}</strong> clients from the Golden Client Master database?
              </p>
              <div className="max-h-48 overflow-y-auto p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs text-left my-2">
                {clients.filter(c => selectedClientIds.has(c.client_id)).slice(0, 8).map(c => (
                  <div key={c.client_id} className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0">
                    <span className="font-bold text-slate-900 truncate max-w-[200px]">{c.investor_name}</span>
                    <span className="font-mono text-[11px] text-slate-500">{c.pan || c.mobile || 'No PAN'}</span>
                  </div>
                ))}
                {selectedClientIds.size > 8 && (
                  <p className="text-[11px] text-slate-400 text-center pt-1 italic">
                    ...and {selectedClientIds.size - 8} more clients
                  </p>
                )}
              </div>
              <p className="text-[11px] text-rose-600 font-semibold">
                ⚠️ All associated master records and client profiles will be permanently purged.
              </p>
            </div>
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsBulkDeleteConfirmOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isBulkDeleting}
                onClick={async () => {
                  try {
                    setIsBulkDeleting(true);
                    if (onBulkDeleteClients) {
                      await onBulkDeleteClients(Array.from(selectedClientIds));
                    } else if (onDeleteClient) {
                      for (const id of selectedClientIds) {
                        await onDeleteClient(id);
                      }
                    }
                    setIsBulkDeleting(false);
                    setIsBulkDeleteConfirmOpen(false);
                    setSelectedClientIds(new Set());
                  } catch (err: any) {
                    setIsBulkDeleting(false);
                    alert('Failed to delete selected clients: ' + err?.message);
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm cursor-pointer transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4 inline mr-1" />
                {isBulkDeleting ? 'Deleting...' : `Yes, Delete (${selectedClientIds.size})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MERGE CLIENTS MODAL */}
      {isMergeModalOpen && onMergeClients && (
        <MergeClientsModal
          isOpen={isMergeModalOpen}
          onClose={() => {
            setIsMergeModalOpen(false);
            setMergeCandidateClients([]);
          }}
          selectedClients={mergeCandidateClients.length > 0 ? mergeCandidateClients : clients.filter(c => selectedClientIds.has(c.client_id))}
          allClients={clients}
          onMerge={async (pId, sIds, consolidated) => {
            await onMergeClients(pId, sIds, consolidated);
            setIsMergeModalOpen(false);
            setSelectedClientIds(new Set());
            setMergeCandidateClients([]);
          }}
        />
      )}
    </div>
  );
};
