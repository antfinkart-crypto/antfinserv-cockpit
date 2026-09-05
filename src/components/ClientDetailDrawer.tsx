import React, { useState } from 'react';
import {
  X,
  User,
  Users,
  Phone,
  Mail,
  MapPin,
  Shield,
  TrendingUp,
  FileText,
  Calendar,
  Edit3,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  MessageSquare,
  Trash2
} from 'lucide-react';
import {
  ClientMasterRecord,
  MfHolding,
  ActiveSip,
  ProtectionAsset,
  ClientChangeLog
} from '../types';
import { InsurancePolicy } from '../types/insurance';
import { calculateCurrentAge } from '../lib/clientMasterParser';
import { generateWhatsAppUrl } from '../lib/whatsAppRouter';
import { EditHoldingModal } from './EditHoldingModal';

interface ClientDetailDrawerProps {
  client: ClientMasterRecord | null;
  isOpen: boolean;
  onClose: () => void;
  allClients: ClientMasterRecord[];
  holdings: MfHolding[];
  sips: ActiveSip[];
  policies: ProtectionAsset[];
  insurancePolicies?: InsurancePolicy[];
  changeLogs: ClientChangeLog[];
  onOpenEdit: (client: ClientMasterRecord) => void;
  onSelectClient: (client: ClientMasterRecord) => void;
  onUpdateHolding?: (updated: MfHolding) => Promise<void>;
  onDeleteHolding?: (holdingId: string) => Promise<void>;
  onDeletePolicy?: (policyId: string) => void;
}

export const ClientDetailDrawer: React.FC<ClientDetailDrawerProps> = ({
  client,
  isOpen,
  onClose,
  allClients,
  holdings,
  sips,
  policies,
  insurancePolicies = [],
  changeLogs,
  onOpenEdit,
  onSelectClient,
  onUpdateHolding,
  onDeleteHolding,
  onDeletePolicy
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'family' | 'portfolio' | 'audit'>('overview');
  const [holdingToEdit, setHoldingToEdit] = useState<MfHolding | null>(null);
  const [isEditHoldingModalOpen, setIsEditHoldingModalOpen] = useState(false);
  const [selectedHoldingIds, setSelectedHoldingIds] = useState<Set<string>>(new Set());
  const [selectedPolicyIds, setSelectedPolicyIds] = useState<Set<string>>(new Set());

  if (!isOpen || !client) return null;

  const currentAge = calculateCurrentAge(client.dob);

  // Linked Financial Assets
  const clientHoldings = holdings.filter(h =>
    (client.pan && h.pan === client.pan) ||
    (h.investor_name && h.investor_name.toLowerCase() === client.investor_name.toLowerCase())
  );
  const clientSips = sips.filter(s =>
    (client.pan && s.pan_number === client.pan) ||
    (s.investor_name && s.investor_name.toLowerCase() === client.investor_name.toLowerCase())
  );
  const clientModernPolicies = insurancePolicies.filter(p =>
    (p.primary_client_id && p.primary_client_id === client.client_id) ||
    p.client_name.toLowerCase().includes(client.investor_name.toLowerCase()) ||
    (p.proposer_name && p.proposer_name.toLowerCase().includes(client.investor_name.toLowerCase())) ||
    (client.pan && p.proposer_pan === client.pan) ||
    (p.members && p.members.some(m => m.client_id === client.client_id || m.member_name.toLowerCase() === client.investor_name.toLowerCase()))
  );
  const clientLegacyPolicies = policies.filter(p =>
    p.client_name.toLowerCase().includes(client.investor_name.toLowerCase()) ||
    (p.primary_member_name && p.primary_member_name.toLowerCase().includes(client.investor_name.toLowerCase()))
  );

  const totalHoldingAum = clientHoldings.reduce((sum, h) => sum + (h.current_value || 0), 0) || (client.aum || 0);
  const totalMonthlySip = clientSips.reduce((sum, s) => sum + (s.monthly_amount || 0), 0);

  // Family Members (same family_id, excluding self)
  const familyMembers = client.family_id
    ? allClients.filter(c => c.family_id === client.family_id && c.client_id !== client.client_id)
    : [];

  const familyHead = client.family_id
    ? allClients.find(c => c.family_id === client.family_id && (c.mapping_role === 'Head' || c.source_user_id === client.family_id))
    : null;

  // Audit Logs for this client
  const clientLogs = changeLogs.filter(l => l.client_id === client.client_id);

  // WhatsApp link
  const waMsg = `Dear ${client.investor_name}, greetings from AntFinserv (ARN-94204). Your consolidated portfolio AUM is ₹${totalHoldingAum.toLocaleString('en-IN')}.`;
  const waUrl = generateWhatsAppUrl(client.mobile, waMsg);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-sm flex justify-end animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col border-l border-slate-200 overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Header Strip */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-13 h-13 rounded-2xl bg-amber-500/10 text-amber-700 border border-amber-500/20 flex items-center justify-center font-black text-xl shadow-sm">
                {client.investor_name.charAt(0)}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                    {client.investor_name}
                  </h2>
                  <span
                    className={`text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full border ${
                      client.mapping_role === 'Head'
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : client.mapping_role === 'Member'
                        ? 'bg-blue-100 text-blue-900 border-blue-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {client.mapping_role || 'Individual'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mt-0.5">
                  <span>ID: {client.client_id.slice(0, 16)}...</span>
                  {client.source_user_id && <span>• USERID: {client.source_user_id}</span>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onOpenEdit(client)}
                className="p-2 rounded-xl text-slate-600 hover:text-amber-700 hover:bg-amber-50 border border-slate-200 transition-all flex items-center gap-1 text-xs font-bold"
                title="Edit Client"
              >
                <Edit3 className="w-4 h-4" />
                <span className="hidden sm:inline">Edit</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-200/60">
            <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Holding AUM</span>
              <p className="text-base md:text-lg font-black text-slate-900 font-mono mt-0.5">
                ₹{totalHoldingAum.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Active Monthly SIP</span>
              <p className="text-base md:text-lg font-black text-emerald-700 font-mono mt-0.5">
                ₹{totalMonthlySip.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">PAN Status</span>
              <p className="text-xs md:text-sm font-bold font-mono mt-1">
                {client.pan ? (
                  <span className="text-slate-900">{client.pan}</span>
                ) : (
                  <span className="text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded text-[11px]">
                    Not Available (Minor)
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="flex items-center gap-2 mt-4 pt-2 border-t border-slate-200/60">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'overview'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              Overview & Identity
            </button>
            <button
              onClick={() => setActiveTab('family')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'family'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Family ({familyMembers.length + (familyHead && familyHead.client_id !== client.client_id ? 1 : 0)})</span>
            </button>
            <button
              onClick={() => setActiveTab('portfolio')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'portfolio'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Assets & MF ({clientHoldings.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'audit'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Audit History ({clientLogs.length})</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: OVERVIEW & IDENTITY */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Data Quality Alerts */}
              {client.data_quality_flags && client.data_quality_flags.length > 0 && (
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Data Quality Indicators ({client.data_quality_flags.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {client.data_quality_flags.map((flg, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-amber-200 text-amber-800"
                      >
                        {flg.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Personal Details Panel */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-xs">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-600" /> Personal Profile
                </h4>
                <div className="grid grid-cols-2 gap-4 text-xs md:text-sm">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Full Legal Name</span>
                    <strong className="text-slate-900 font-semibold">{client.investor_name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">PAN Number</span>
                    <strong className="font-mono text-slate-900">
                      {client.pan ? client.pan : <span className="text-amber-600">PAN Not Available (Minor)</span>}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Date of Birth (DOB)</span>
                    <strong className="text-slate-900">{client.dob || 'Not Recorded'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Calculated Age</span>
                    <strong className="text-slate-900">
                      {currentAge !== undefined ? `${currentAge} yrs` : 'Unknown'}
                    </strong>
                    {client.source_age && (
                      <span className="text-[10px] text-slate-400 ml-1.5">(Source: {client.source_age})</span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Gender</span>
                    <strong className="text-slate-900">{client.gender}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Source System</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {client.source_system}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" /> Contact Details
                  </h4>
                  {client.mobile && (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1 border border-emerald-200 transition-all"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs md:text-sm">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Mobile Number</span>
                    <strong className="font-mono text-slate-900">{client.mobile || 'Not Recorded'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Email Address</span>
                    <strong className="text-slate-900 truncate block">{client.email || 'Not Recorded'}</strong>
                  </div>
                </div>
              </div>

              {/* Address Details */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-2 shadow-xs">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" /> Residential Address
                </h4>
                <div className="text-xs md:text-sm text-slate-700 space-y-0.5 leading-relaxed">
                  {client.address_line_1 && <p>{client.address_line_1}</p>}
                  {client.address_line_2 && <p>{client.address_line_2}</p>}
                  {client.address_line_3 && <p>{client.address_line_3}</p>}
                  <p className="font-semibold text-slate-900 mt-1">
                    {[client.city, client.state, client.pincode].filter(Boolean).join(', ') || 'No address recorded'}
                  </p>
                </div>
              </div>

              {/* Distribution & RM */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-xs">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-600" /> Distribution & Advisory
                </h4>
                <div className="grid grid-cols-3 gap-3 text-xs md:text-sm">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Relationship Manager</span>
                    <strong className="text-slate-900">{client.rm_name || 'Unassigned'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Associate Name</span>
                    <strong className="text-slate-900">{client.associate_name || 'Unassigned'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Branch</span>
                    <strong className="text-slate-900">{client.branch || 'Corporate Head Office'}</strong>
                  </div>
                  {client.bse_nse_code && (
                    <div>
                      <span className="text-slate-400 block text-[11px]">BSE/NSE Code</span>
                      <strong className="font-mono text-slate-900">{client.bse_nse_code}</strong>
                    </div>
                  )}
                  {client.broker_code && (
                    <div>
                      <span className="text-slate-400 block text-[11px]">Broker / ARN</span>
                      <strong className="font-mono text-slate-900">{client.broker_code}</strong>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FAMILY & HOUSEHOLD */}
          {activeTab === 'family' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-blue-50/50 border border-blue-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-blue-700 tracking-wider">Household ID</span>
                    <h3 className="text-lg font-black text-slate-900 font-mono">{client.family_id || 'No Family ID'}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-blue-700 tracking-wider">Role</span>
                    <p className="text-sm font-black text-blue-900">{client.mapping_role || 'Individual'}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  FAMILY ID represents the household group. In MFbox, it matches the Family Head's USERID while preserving each family member's individual identity.
                </p>
              </div>

              {/* Family Head Card (if different from current client) */}
              {familyHead && familyHead.client_id !== client.client_id && (
                <div
                  onClick={() => onSelectClient(familyHead)}
                  className="p-4 rounded-2xl border border-amber-200 bg-amber-50/30 hover:bg-amber-50 cursor-pointer transition-all space-y-1"
                >
                  <span className="text-[10px] uppercase font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                    Family Head
                  </span>
                  <h4 className="text-base font-bold text-slate-900">{familyHead.investor_name}</h4>
                  <p className="text-xs text-slate-500 font-mono">
                    PAN: {familyHead.pan || 'N/A'} • Mobile: {familyHead.mobile || 'N/A'}
                  </p>
                </div>
              )}

              {/* Family Members List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Household Members ({familyMembers.length})
                </h4>

                {familyMembers.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
                    No other family members linked to Family ID {client.family_id || 'N/A'}.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {familyMembers.map((fm) => (
                      <div
                        key={fm.client_id}
                        onClick={() => onSelectClient(fm)}
                        className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-amber-300 hover:shadow-xs cursor-pointer transition-all flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900">{fm.investor_name}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                              {fm.mapping_role}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">
                            PAN: {fm.pan || 'Not Available'} • DOB: {fm.dob || 'N/A'}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-mono font-bold text-slate-900">
                            ₹{(fm.aum || 0).toLocaleString('en-IN')}
                          </span>
                          <span className="block text-[10px] text-slate-400">AUM</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: PORTFOLIO & FINANCIAL ASSETS */}
          {activeTab === 'portfolio' && (
            <div className="space-y-6">
              {/* Holdings Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-amber-600" /> Mutual Fund Holdings ({clientHoldings.length})
                  </h4>
                  <div className="flex items-center gap-2">
                    {selectedHoldingIds.size > 0 && onDeleteHolding && (
                      <button
                        type="button"
                        onClick={async () => {
                          if (window.confirm(`Delete ${selectedHoldingIds.size} selected holding(s)? Client AUM will be recalculated automatically.`)) {
                            for (const hid of Array.from(selectedHoldingIds)) {
                              await onDeleteHolding(hid);
                            }
                            setSelectedHoldingIds(new Set());
                          }
                        }}
                        className="px-2.5 py-1 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 flex items-center gap-1 transition-all"
                      >
                        <Trash2 className="w-3 h-3" /> Delete Selected ({selectedHoldingIds.size})
                      </button>
                    )}
                    <span className="text-xs font-mono font-bold text-slate-900">
                      Total: ₹{totalHoldingAum.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {clientHoldings.length === 0 ? (
                  <div className="p-6 text-center rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
                    No mutual fund holdings found matching PAN {client.pan || 'N/A'}.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {clientHoldings.map((h, i) => {
                      const holdingKey = h.id || `${h.pan}-${h.scheme_name}-${h.folio_number}-${i}`;
                      const isChecked = selectedHoldingIds.has(holdingKey);
                      return (
                        <div key={holdingKey} className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3 text-xs shadow-xs hover:border-amber-200 transition-all">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {onDeleteHolding && (
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  const next = new Set(selectedHoldingIds);
                                  if (e.target.checked) next.add(holdingKey);
                                  else next.delete(holdingKey);
                                  setSelectedHoldingIds(next);
                                }}
                                className="w-3.5 h-3.5 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer"
                              />
                            )}
                            <div className="truncate">
                              <p className="font-bold text-slate-900 truncate">{h.scheme_name}</p>
                              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                                Folio: {h.folio_number || 'N/A'} • Units: {(h.holding_units || 0).toFixed(2)} • NAV: ₹{(h.latest_nav || h.avg_nav || 0).toFixed(2)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <div className="text-right">
                              <p className="font-bold text-slate-900 font-mono">₹{(h.current_value || 0).toLocaleString('en-IN')}</p>
                              {h.xirr ? (
                                <p className="text-[10px] text-emerald-600 font-semibold">{h.xirr.toFixed(1)}% XIRR</p>
                              ) : (
                                <p className="text-[10px] text-slate-400 font-mono">Cost: ₹{(h.invested_cost || 0).toLocaleString('en-IN')}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              {onUpdateHolding && (
                                <button
                                  type="button"
                                  title="Edit Holding"
                                  onClick={() => {
                                    setHoldingToEdit(h);
                                    setIsEditHoldingModalOpen(true);
                                  }}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {onDeleteHolding && (
                                <button
                                  type="button"
                                  title="Delete Holding"
                                  onClick={async () => {
                                    if (window.confirm(`Delete holding "${h.scheme_name}"? Client AUM will be auto-recalculated.`)) {
                                      await onDeleteHolding(h.id || holdingKey);
                                    }
                                  }}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
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

              {/* Active SIPs Section */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" /> Active SIP Mandates ({clientSips.length})
                  </h4>
                  <span className="text-xs font-mono font-bold text-emerald-700">
                    Total: ₹{totalMonthlySip.toLocaleString('en-IN')}/mo
                  </span>
                </div>

                {clientSips.length === 0 ? (
                  <div className="p-6 text-center rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
                    No active SIPs found matching PAN {client.pan || 'N/A'}.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {clientSips.map((s, i) => (
                      <div key={i} className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3 text-xs shadow-xs">
                        <div className="truncate">
                          <p className="font-bold text-slate-900 truncate">{s.scheme_name}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">Due Day: {s.sip_date}th of every month</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-emerald-700 font-mono">₹{s.monthly_amount.toLocaleString('en-IN')}/mo</p>
                          <span className="text-[10px] text-slate-400">Folio: {s.folio_number}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Protection & Insurance Policies */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600" /> Insurance & Protection Policies ({clientModernPolicies.length + clientLegacyPolicies.length})
                  </h4>
                  {selectedPolicyIds.size > 0 && onDeletePolicy && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Delete ${selectedPolicyIds.size} selected policy(ies)?`)) {
                          selectedPolicyIds.forEach(id => onDeletePolicy(id));
                          setSelectedPolicyIds(new Set());
                        }
                      }}
                      className="px-2.5 py-1 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 flex items-center gap-1 transition-all"
                    >
                      <Trash2 className="w-3 h-3" /> Delete Selected ({selectedPolicyIds.size})
                    </button>
                  )}
                </div>

                {clientModernPolicies.length === 0 && clientLegacyPolicies.length === 0 ? (
                  <div className="p-6 text-center rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
                    No insurance policies recorded. Upload policies in Protection Vault.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Modern Policies */}
                    {clientModernPolicies.map((p) => {
                      const isChecked = selectedPolicyIds.has(p.id);
                      const gross = p.gross_premium || p.net_premium || 0;
                      return (
                        <div key={p.id} className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3 text-xs shadow-xs hover:border-amber-200 transition-all">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {onDeletePolicy && (
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  const next = new Set(selectedPolicyIds);
                                  if (e.target.checked) next.add(p.id);
                                  else next.delete(p.id);
                                  setSelectedPolicyIds(next);
                                }}
                                className="w-3.5 h-3.5 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer"
                              />
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-slate-900 truncate">{p.insurer_name}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-semibold uppercase">
                                  {p.policy_type || p.vertical}
                                </span>
                                {(p.property_address || (p.vertical_data as any)?.risk_location_address || (p.vertical_data as any)?.property_address) && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-medium truncate max-w-[150px]" title={p.property_address || (p.vertical_data as any)?.risk_location_address || (p.vertical_data as any)?.property_address}>
                                    {p.property_address || (p.vertical_data as any)?.risk_location_address || (p.vertical_data as any)?.property_address}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                                #{p.policy_number} • {p.plan_name || p.product_name || 'Standard Plan'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <div className="text-right">
                              <p className="font-extrabold text-amber-700 font-mono text-sm">
                                ₹{gross.toLocaleString('en-IN')}
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                Cover: ₹{(p.sum_insured || 0).toLocaleString('en-IN')}
                              </p>
                            </div>
                            {onDeletePolicy && (
                              <button
                                type="button"
                                title="Delete Policy"
                                onClick={() => {
                                  if (window.confirm(`Delete policy ${p.policy_number}?`)) {
                                    onDeletePolicy(p.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Legacy Policies */}
                    {clientLegacyPolicies.map((p, i) => (
                      <div key={`leg-${i}`} className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3 text-xs shadow-xs">
                        <div>
                          <p className="font-bold text-slate-900">{p.insurer} — {p.policy_type}</p>
                          <p className="text-[11px] font-mono text-slate-500 mt-0.5">Policy #{p.policy_number}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-900 font-mono">₹{p.sum_insured.toLocaleString('en-IN')} Cover</p>
                          <p className="text-[10px] text-slate-400">Exp: {p.expiry_date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: CHANGE HISTORY & AUDIT LOGS */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" /> Change Log Trail
              </h4>

              {clientLogs.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
                  No manual or import modifications recorded for this client.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {clientLogs.map((log) => (
                    <div key={log.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 font-mono">{log.field.toUpperCase()}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(log.changed_at).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <span className="line-through text-slate-400">{String(log.old_value || 'None')}</span>
                        <span>&rarr;</span>
                        <span className="font-bold text-emerald-700">{String(log.new_value || 'Blank')}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-200/60 flex items-center justify-between">
                        <span>Source: {log.source}</span>
                        <span>By: {log.changed_by}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Holding Modal */}
      {isEditHoldingModalOpen && holdingToEdit && onUpdateHolding && (
        <EditHoldingModal
          isOpen={isEditHoldingModalOpen}
          holding={holdingToEdit}
          onClose={() => {
            setIsEditHoldingModalOpen(false);
            setHoldingToEdit(null);
          }}
          onSave={async (updated) => {
            await onUpdateHolding(updated);
            setIsEditHoldingModalOpen(false);
            setHoldingToEdit(null);
          }}
        />
      )}
    </div>
  );
};
