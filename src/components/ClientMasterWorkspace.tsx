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
  Plus
} from 'lucide-react';
import {
  ClientMasterRecord,
  ClientImportBatch,
  AmbiguousClientMatch,
  ClientChangeLog,
  MfHolding,
  ActiveSip,
  ProtectionAsset
} from '../types';
import { parseClientMasterReport, calculateCurrentAge } from '../lib/clientMasterParser';
import { matchAndUpsertClients } from '../lib/clientMatchingEngine';
import { ClientDetailDrawer } from './ClientDetailDrawer';
import { EditClientModal } from './EditClientModal';
import { generateWhatsAppUrl } from '../lib/whatsAppRouter';

interface ClientMasterWorkspaceProps {
  clients: ClientMasterRecord[];
  holdings: MfHolding[];
  sips: ActiveSip[];
  policies: ProtectionAsset[];
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
}

export const ClientMasterWorkspace: React.FC<ClientMasterWorkspaceProps> = ({
  clients,
  holdings,
  sips,
  policies,
  importHistory,
  reviewQueue,
  changeLogs,
  onCommitImport,
  onSaveManualEdit,
  onResolveReview
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'families' | 'import' | 'review' | 'quality' | 'history'>('all');

  // Drawer & Modal states
  const [selectedClient, setSelectedClient] = useState<ClientMasterRecord | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientMasterRecord | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [panFilter, setPanFilter] = useState<string>('ALL'); // ALL, HAS_PAN, NO_PAN
  const [qualityFilter, setQualityFilter] = useState<string>('ALL');
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

  // Filtered and Sorted Clients
  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      // 1. Search filter
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

      // 2. Role filter
      if (roleFilter !== 'ALL' && c.mapping_role !== roleFilter) return false;

      // 3. PAN filter
      if (panFilter === 'HAS_PAN' && !c.pan) return false;
      if (panFilter === 'NO_PAN' && c.pan) return false;

      // 4. Quality filter
      if (qualityFilter !== 'ALL') {
        if (!c.data_quality_flags || !c.data_quality_flags.includes(qualityFilter as any)) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
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
  }, [clients, searchTerm, roleFilter, panFilter, qualityFilter, sortBy, sortOrder]);

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

      // Parse file
      const parsed = await parseClientMasterReport(file);

      // Run matching & upsert against existing clients
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
                  Central Identity Layer
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-500 mt-0.5">
                Authoritative client & household registry powering Mutual Funds, SIP Shield, Insurance, Loans, and Celebrations.
              </p>
            </div>
          </div>
        </div>

        {/* Global Action CTAs */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveSubTab('import')}
            className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs md:text-sm flex items-center gap-2 shadow-xs transition-all"
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
          <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">DOB Coverage</span>
          <p className="text-2xl font-black text-slate-900 mt-1 font-mono">{dobPercentage}%</p>
          <span className="text-[11px] text-emerald-600 font-semibold">{clientsWithDobCount} Celebrations Ready</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Mobile Reach</span>
          <p className="text-2xl font-black text-emerald-700 mt-1 font-mono">{mobilePercentage}%</p>
          <span className="text-[11px] text-slate-500">{clientsWithMobileCount} Valid Numbers</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Review Queue</span>
          <p className="text-2xl font-black text-amber-600 mt-1 font-mono">{reviewQueue.length}</p>
          <span className="text-[11px] text-slate-500">Ambiguous Matches</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Total AUM</span>
          <p className="text-xl font-black text-slate-900 mt-1.5 font-mono truncate">
            ₹{clients.reduce((s, c) => s + (c.aum || 0), 0).toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-slate-400">Recorded in Master</span>
        </div>
      </div>

      {/* Navigation Sub-Tabs Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-2 rounded-2xl shadow-xs overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1 py-1.5">
          <button
            onClick={() => setActiveSubTab('all')}
            className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'all'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>All Clients ({filteredClients.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('families')}
            className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'families'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Families & Households ({familyGroups.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('import')}
            className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'import'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Import Engine</span>
          </button>

          <button
            onClick={() => setActiveSubTab('review')}
            className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'review'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Review Queue</span>
            {reviewQueue.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900">
                {reviewQueue.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('quality')}
            className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'quality'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Data Quality Radar</span>
          </button>

          <button
            onClick={() => setActiveSubTab('history')}
            className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'history'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Import History</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: ALL CLIENTS DIRECTORY */}
      {/* ========================================================================= */}
      {activeSubTab === 'all' && (
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
                className="p-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 focus:outline-none"
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
                className="p-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 focus:outline-none"
              >
                <option value="ALL">All PAN Statuses</option>
                <option value="HAS_PAN">Has PAN</option>
                <option value="NO_PAN">No PAN (Minor / Excluded)</option>
              </select>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="p-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 focus:outline-none"
              >
                <option value="name">Sort by Name</option>
                <option value="aum">Sort by AUM</option>
                <option value="dob">Sort by DOB</option>
                <option value="date">Sort by Date</option>
              </select>

              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600"
                title="Toggle sort direction"
              >
                <ArrowUpDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Table Container */}
          {filteredClients.length === 0 ? (
            <div className="glass-panel p-12 md:p-16 text-center rounded-2xl border border-slate-200 space-y-3 bg-white">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No Clients Match Current Filters</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try clearing search terms or filters, or import your latest MFbox Client Master report.
              </p>
            </div>
          ) : (
            <div className="glass-panel rounded-2xl border border-slate-200 overflow-hidden shadow-xs bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs md:text-sm">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider font-bold">
                      <th className="py-3 px-4">Client Name & Role</th>
                      <th className="py-3 px-4">PAN Number</th>
                      <th className="py-3 px-4">Contact Details</th>
                      <th className="py-3 px-4">DOB / Age</th>
                      <th className="py-3 px-4">Family Link</th>
                      <th className="py-3 px-4 text-right">Master AUM</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedClients.map((client) => {
                      const age = calculateCurrentAge(client.dob);
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
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-xs flex-shrink-0">
                                {client.investor_name.charAt(0)}
                              </div>
                              <div className="truncate max-w-[200px]">
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
                            <div className="space-y-0.5 text-slate-600">
                              <p className="font-mono">{client.mobile || '—'}</p>
                              <p className="text-[11px] text-slate-400 truncate max-w-[160px]">
                                {client.email || '—'}
                              </p>
                            </div>
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

                          <td
                            className="py-3 px-4 text-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-center gap-1.5">
                              {client.mobile && (
                                <a
                                  href={waUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50"
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
                                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-700 hover:bg-slate-100"
                                title="Edit Profile"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
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
                    className="p-2 rounded-xl border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-bold text-slate-700">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    className="p-2 rounded-xl border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
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
      {/* SUB-TAB 2: FAMILIES & HOUSEHOLDS */}
      {/* ========================================================================= */}
      {activeSubTab === 'families' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200/80 text-xs text-blue-900 leading-relaxed">
            Family groups are grouped by <strong>FAMILY ID</strong>. MFbox assigns the Family Head's USERID to all members, establishing family context while keeping individual PANs, DOBs, and investments separate.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {familyGroups.map((grp) => (
              <div
                key={grp.familyId}
                className="glass-panel p-5 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-xs"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Household</span>
                    <h3 className="text-base font-bold text-slate-900 font-mono">
                      ID: {grp.familyId}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Total Family AUM</span>
                    <p className="text-base font-black text-slate-900 font-mono">
                      ₹{grp.totalAum.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>

                {/* Head Card */}
                {grp.head ? (
                  <div
                    onClick={() => {
                      setSelectedClient(grp.head);
                      setIsDrawerOpen(true);
                    }}
                    className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/40 hover:bg-amber-50 cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-200/70 text-amber-900">
                        Family Head
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-1">{grp.head.investor_name}</h4>
                      <p className="text-xs text-slate-500 font-mono">PAN: {grp.head.pan || 'N/A'}</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-900">
                      ₹{(grp.head.aum || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 italic">No designated head found for this group</div>
                )}

                {/* Members List */}
                {grp.members.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      Members ({grp.members.length})
                    </span>
                    {grp.members.map((mem) => (
                      <div
                        key={mem.client_id}
                        onClick={() => {
                          setSelectedClient(mem);
                          setIsDrawerOpen(true);
                        }}
                        className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-100/70 cursor-pointer transition-all flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-semibold text-slate-900">{mem.investor_name}</span>
                          <p className="text-[11px] text-slate-500 font-mono">
                            PAN: {mem.pan || 'Minor / Not Available'} • {mem.gender}
                          </p>
                        </div>
                        <span className="font-mono font-bold text-slate-700">
                          ₹{(mem.aum || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: IMPORT ENGINE */}
      {/* ========================================================================= */}
      {activeSubTab === 'import' && (
        <div className="space-y-6 max-w-3xl mx-auto">
          <div className="glass-panel p-8 rounded-3xl border border-slate-200 bg-white text-center space-y-4 shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <Upload className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Import MFbox Client Master Export</h3>
              <p className="text-xs md:text-sm text-slate-500 max-w-md mx-auto mt-1">
                Upload your official MFbox Client Master file (.xlsx, .xls, .csv, .txt). The system automatically maps all 24 columns, validates identities, and performs non-destructive updates.
              </p>
            </div>

            <div className="pt-2">
              <label className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs md:text-sm cursor-pointer shadow-xs transition-all">
                <FileSpreadsheet className="w-4 h-4" />
                <span>Select Client Master File</span>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
            {isParsing && <p className="text-xs text-amber-600 font-semibold animate-pulse">Scanning and validating columns...</p>}
          </div>

          {/* Import Preview Modal / Box */}
          {importPreview && (
            <div className="glass-panel p-6 rounded-3xl border border-amber-200 bg-white space-y-5 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h4 className="text-base font-bold text-slate-900">Pre-Import Validation Summary</h4>
                  <p className="text-xs text-slate-500">File: {importFile?.name}</p>
                </div>
                <span className="text-xs font-mono font-bold bg-amber-100 text-amber-900 px-2.5 py-1 rounded-full">
                  {importPreview.importBatch.rows_processed} Rows Detected
                </span>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                  <span className="text-[10px] uppercase font-bold text-emerald-700">New Clients</span>
                  <p className="text-xl font-black text-emerald-800 font-mono mt-0.5">{importPreview.newClients.length}</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                  <span className="text-[10px] uppercase font-bold text-blue-700">Updates (Non-Destructive)</span>
                  <p className="text-xl font-black text-blue-800 font-mono mt-0.5">{importPreview.updatedClients.length}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-600">Unchanged</span>
                  <p className="text-xl font-black text-slate-800 font-mono mt-0.5">{importPreview.unchangedClients.length}</p>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                  <span className="text-[10px] uppercase font-bold text-amber-700">Ambiguous</span>
                  <p className="text-xl font-black text-amber-800 font-mono mt-0.5">{importPreview.ambiguousMatches.length}</p>
                </div>
              </div>

              {/* Data Quality Health in File */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                <span className="font-bold text-slate-700 block">Dataset Health Check:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-600">
                  <span>Missing PAN (Minors): <strong>{importPreview.importBatch.missing_pan_count}</strong></span>
                  <span>Missing DOB: <strong>{importPreview.importBatch.missing_dob_count}</strong></span>
                  <span>Missing Mobile: <strong>{importPreview.importBatch.missing_mobile_count}</strong></span>
                  <span>Missing Email: <strong>{importPreview.importBatch.missing_email_count}</strong></span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    setImportPreview(null);
                    setImportFile(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExecuteImport}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    Commit Import ({importPreview.newClients.length} New, {importPreview.updatedClients.length} Updated)
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: REVIEW QUEUE */}
      {/* ========================================================================= */}
      {activeSubTab === 'review' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 leading-relaxed">
            Records appear in the Review Queue when multiple conflicting existing client records match an incoming row (e.g. shared mobile and name but differing USERIDs). ANTOS avoids auto-merging ambiguous data to protect client records.
          </div>

          {reviewQueue.length === 0 ? (
            <div className="glass-panel p-12 text-center rounded-2xl border border-slate-200 space-y-2 bg-white">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">Review Queue Clear</h3>
              <p className="text-xs text-slate-500">Zero identity conflicts detected across all imports.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviewQueue.map((item) => (
                <div key={item.id} className="glass-panel p-5 rounded-2xl border border-amber-200 bg-white space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                      Ambiguous Conflict
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(item.created_at).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800">{item.reason}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-2">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="font-bold text-slate-600 block mb-1">Incoming Row:</span>
                      <p className="font-bold text-slate-900">{item.incoming_record.investor_name}</p>
                      <p className="font-mono text-slate-600">
                        PAN: {item.incoming_record.pan || 'None'} • Mobile: {item.incoming_record.mobile || 'None'}
                      </p>
                      <p className="text-slate-500 text-[11px]">DOB: {item.incoming_record.dob || 'None'}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-200">
                      <span className="font-bold text-blue-800 block mb-1">
                        Candidate Matches in Database ({item.existing_matches.length}):
                      </span>
                      {item.existing_matches.map((m) => (
                        <div key={m.client_id} className="pb-1 mb-1 border-b border-blue-100 last:border-none">
                          <p className="font-bold text-slate-900">{m.investor_name} ({m.client_id.slice(0, 10)}...)</p>
                          <p className="font-mono text-slate-600 text-[11px]">
                            PAN: {m.pan || 'None'} • Mobile: {m.mobile}
                          </p>
                          <button
                            onClick={() => onResolveReview(item.id, 'MERGE', m.client_id)}
                            className="mt-1 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px]"
                          >
                            Merge with this client
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => onResolveReview(item.id, 'CREATE_AS_NEW')}
                      className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
                    >
                      Create as Separate Client
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 5: DATA QUALITY RADAR */}
      {/* ========================================================================= */}
      {activeSubTab === 'quality' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <button
              onClick={() => {
                setQualityFilter('MISSING_DOB');
                setActiveSubTab('all');
              }}
              className="p-4 rounded-2xl bg-white border border-slate-200 text-left hover:border-amber-400 shadow-xs transition-all"
            >
              <Calendar className="w-5 h-5 text-rose-600 mb-1" />
              <h4 className="font-bold text-slate-900">Missing DOB ({clients.filter(c => !c.dob).length})</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Cannot calculate age or birthdays</p>
            </button>

            <button
              onClick={() => {
                setQualityFilter('MISSING_MOBILE');
                setActiveSubTab('all');
              }}
              className="p-4 rounded-2xl bg-white border border-slate-200 text-left hover:border-amber-400 shadow-xs transition-all"
            >
              <Phone className="w-5 h-5 text-emerald-600 mb-1" />
              <h4 className="font-bold text-slate-900">Missing Mobile ({clients.filter(c => !c.mobile).length})</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Cannot dispatch WhatsApp reminders</p>
            </button>

            <button
              onClick={() => {
                setQualityFilter('MISSING_EMAIL');
                setActiveSubTab('all');
              }}
              className="p-4 rounded-2xl bg-white border border-slate-200 text-left hover:border-amber-400 shadow-xs transition-all"
            >
              <Mail className="w-5 h-5 text-blue-600 mb-1" />
              <h4 className="font-bold text-slate-900">Missing Email ({clients.filter(c => !c.email).length})</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Cannot send digital portfolio statements</p>
            </button>

            <button
              onClick={() => {
                setPanFilter('NO_PAN');
                setActiveSubTab('all');
              }}
              className="p-4 rounded-2xl bg-white border border-slate-200 text-left hover:border-amber-400 shadow-xs transition-all"
            >
              <Shield className="w-5 h-5 text-amber-600 mb-1" />
              <h4 className="font-bold text-slate-900">Minors / No PAN ({minorsWithoutPanCount})</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Legitimate minor records</p>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 6: IMPORT HISTORY */}
      {/* ========================================================================= */}
      {activeSubTab === 'history' && (
        <div className="space-y-4">
          {importHistory.length === 0 ? (
            <div className="glass-panel p-12 text-center rounded-2xl border border-slate-200 space-y-2 bg-white">
              <History className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">No Import History Yet</h3>
              <p className="text-xs text-slate-500">Imports will appear here chronologically with change statistics.</p>
            </div>
          ) : (
            <div className="glass-panel rounded-2xl border border-slate-200 overflow-hidden shadow-xs bg-white">
              <table className="w-full text-left border-collapse text-xs md:text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] uppercase font-bold">
                    <th className="py-3 px-4">Import ID & File</th>
                    <th className="py-3 px-4">Date & User</th>
                    <th className="py-3 px-4 text-center">Processed</th>
                    <th className="py-3 px-4 text-center">New</th>
                    <th className="py-3 px-4 text-center">Updated</th>
                    <th className="py-3 px-4 text-center">Unchanged</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {importHistory.map((b) => (
                    <tr key={b.import_id} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 font-sans">{b.source_filename}</span>
                        <span className="block text-[11px] text-slate-400">{b.import_id}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-sans">
                        {new Date(b.imported_at).toLocaleString('en-IN')}
                        <span className="block text-[11px] text-slate-400">By: {b.imported_by}</span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-900">{b.rows_processed}</td>
                      <td className="py-3 px-4 text-center font-bold text-emerald-700">+{b.new_count}</td>
                      <td className="py-3 px-4 text-center font-bold text-blue-700">{b.updated_count}</td>
                      <td className="py-3 px-4 text-center text-slate-500">{b.unchanged_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Client Detail Drawer */}
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
        changeLogs={changeLogs}
        onOpenEdit={(c) => {
          setEditingClient(c);
          setIsEditModalOpen(true);
        }}
        onSelectClient={(c) => setSelectedClient(c)}
      />

      {/* Edit Client Modal */}
      {editingClient && (
        <EditClientModal
          client={editingClient}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingClient(null);
          }}
          onSave={onSaveManualEdit}
        />
      )}
    </div>
  );
};
