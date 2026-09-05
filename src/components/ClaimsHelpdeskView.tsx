import React, { useState, useMemo } from 'react';
import {
  PhoneCall,
  Mail,
  ExternalLink,
  ShieldCheck,
  Search,
  CheckCircle2,
  Copy,
  Plus,
  FileText,
  AlertCircle,
  Building2,
  Car,
  Heart,
  Home,
  Clock,
  Sparkles,
  Edit3,
  X
} from 'lucide-react';
import { InsurerRecord, DEFAULT_INSURERS } from '../data/insurerRegistry';
import { CLAIMS_CHECKLISTS, ClaimChecklistItem } from '../data/claimsChecklistData';
import { InsurancePolicy } from '../types/insurance';

interface ClaimsHelpdeskViewProps {
  policies?: InsurancePolicy[];
  insurers?: InsurerRecord[];
  onAddOrUpdateInsurer?: (insurer: InsurerRecord) => Promise<void>;
}

export const ClaimsHelpdeskView: React.FC<ClaimsHelpdeskViewProps> = ({
  policies = [],
  insurers = DEFAULT_INSURERS,
  onAddOrUpdateInsurer
}) => {
  const [selectedVertical, setSelectedVertical] = useState<'ALL' | 'HEALTH' | 'MOTOR' | 'LIFE' | 'HOME_PROPERTY'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChecklistKey, setActiveChecklistKey] = useState<'health_reimbursement' | 'motor_accident_od' | 'life_death_claim' | 'home_property_claim'>('health_reimbursement');
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  // Modal for adding custom insurer from actual policy
  const [isAddInsurerModalOpen, setIsAddInsurerModalOpen] = useState(false);
  const [editingInsurer, setEditingInsurer] = useState<Partial<InsurerRecord>>({
    name: '',
    claims_helpline_tollfree: '',
    claims_email: '',
    customer_support_phone: '',
    cashless_portal_url: '',
    head_office_address: '',
    verticals: ['HEALTH']
  });

  // Filtered Insurers
  const filteredInsurers = useMemo(() => {
    return insurers.filter(ins => {
      const matchVertical = selectedVertical === 'ALL' || ins.verticals.includes(selectedVertical as any);
      const matchSearch =
        searchQuery.trim() === '' ||
        ins.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ins.aliases.some(a => a.toLowerCase().includes(searchQuery.toLowerCase())) ||
        ins.claims_helpline_tollfree.includes(searchQuery) ||
        ins.claims_email.toLowerCase().includes(searchQuery.toLowerCase());
      return matchVertical && matchSearch;
    });
  }, [insurers, selectedVertical, searchQuery]);

  // Current active checklist
  const currentChecklist = CLAIMS_CHECKLISTS[activeChecklistKey];

  const handleToggleCheck = (id: string) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCopyWhatsApp = () => {
    const text = currentChecklist.whatsappTemplate('Valued Client', 'POL-XXXXX', 'Insurance Company');
    navigator.clipboard.writeText(text);
    setCopiedNotification('Checklist copied to clipboard! Ready to paste into client WhatsApp chat.');
    setTimeout(() => setCopiedNotification(null), 4000);
  };

  const handleSaveInsurer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInsurer.name || !editingInsurer.claims_helpline_tollfree) {
      alert('Company Name and Claims Helpline are required.');
      return;
    }

    const newRecord: InsurerRecord = {
      id: editingInsurer.id || `ins_${Date.now()}`,
      name: editingInsurer.name.trim(),
      aliases: editingInsurer.aliases || [editingInsurer.name.trim()],
      verticals: editingInsurer.verticals || ['HEALTH'],
      claims_helpline_tollfree: editingInsurer.claims_helpline_tollfree.trim(),
      claims_helpline_alternate: editingInsurer.claims_helpline_alternate?.trim() || undefined,
      customer_support_phone: editingInsurer.customer_support_phone?.trim() || editingInsurer.claims_helpline_tollfree.trim(),
      claims_email: editingInsurer.claims_email?.trim() || 'claims@insurance.com',
      customer_support_email: editingInsurer.customer_support_email?.trim() || 'support@insurance.com',
      cashless_portal_url: editingInsurer.cashless_portal_url?.trim() || 'https://www.irdai.gov.in',
      cashless_network_url: editingInsurer.cashless_network_url?.trim() || undefined,
      head_office_address: editingInsurer.head_office_address?.trim() || 'India',
      irda_reg_no: editingInsurer.irda_reg_no?.trim() || undefined,
      verified_from_policy: editingInsurer.verified_from_policy || 'Manual Advisor Entry',
      verified_at: new Date().toISOString().split('T')[0]
    };

    if (onAddOrUpdateInsurer) {
      await onAddOrUpdateInsurer(newRecord);
    }
    setIsAddInsurerModalOpen(false);
    setEditingInsurer({
      name: '',
      claims_helpline_tollfree: '',
      claims_email: '',
      customer_support_phone: '',
      cashless_portal_url: '',
      head_office_address: '',
      verticals: ['HEALTH']
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-lg space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
              <PhoneCall className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight">Verified Insurer Claims Repository & Initial Checklists</h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  100% Policy Verified
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Authentic 24x7 toll-free claims helplines, claims intimation emails, cashless portals & client document checklists.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setEditingInsurer({
                name: '',
                claims_helpline_tollfree: '',
                claims_email: '',
                customer_support_phone: '',
                cashless_portal_url: '',
                head_office_address: '',
                verticals: ['HEALTH']
              });
              setIsAddInsurerModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add / Verify Company Contacts</span>
          </button>
        </div>
      </div>

      {/* Copy Notification Toast */}
      {copiedNotification && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-xs animate-in slide-in-from-top duration-200">
          <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{copiedNotification}</span>
        </div>
      )}

      {/* Grid: 2 Column Layout (Left: Insurer Directory, Right: Interactive Document Checklist) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: INSURER DIRECTORY (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Vertical Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {[
                { id: 'ALL', label: 'All Companies' },
                { id: 'HEALTH', label: 'Health' },
                { id: 'MOTOR', label: 'Motor' },
                { id: 'LIFE', label: 'Life' },
                { id: 'HOME_PROPERTY', label: 'Home/Property' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedVertical(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    selectedVertical === tab.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search insurer, helpline, email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500 shadow-xs"
              />
            </div>
          </div>

          {/* Insurers Cards List */}
          <div className="space-y-3 max-h-[750px] overflow-y-auto pr-1">
            {filteredInsurers.length === 0 ? (
              <div className="p-12 text-center rounded-2xl border border-slate-200 bg-white space-y-2 text-slate-500 text-xs">
                <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="font-bold text-slate-700">No insurance companies match your search.</p>
                <p>Click "Add / Verify Company Contacts" to register a new insurer.</p>
              </div>
            ) : (
              filteredInsurers.map(ins => (
                <div
                  key={ins.id}
                  className="p-4.5 rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 shadow-xs space-y-3 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-extrabold text-sm text-slate-900">{ins.name}</h4>
                        {ins.irda_reg_no && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                            IRDAI Reg #{ins.irda_reg_no}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{ins.head_office_address}</p>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {ins.verticals.map(v => (
                        <span key={v} className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Helplines Strip */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                    <a
                      href={`tel:${ins.claims_helpline_tollfree.replace(/\D/g, '')}`}
                      className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 flex items-center justify-between transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                        <div>
                          <span className="text-[10px] text-emerald-700 font-bold uppercase block">24x7 Claims Helpline</span>
                          <strong className="font-mono text-xs">{ins.claims_helpline_tollfree}</strong>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 group-hover:underline">Call &rarr;</span>
                    </a>

                    <a
                      href={`mailto:${ins.claims_email}?subject=${encodeURIComponent(`New Claim Intimation - AntFinServ Client`)}`}
                      className="p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 flex items-center justify-between transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                        <div className="truncate">
                          <span className="text-[10px] text-blue-700 font-bold uppercase block">Claims Intimation Email</span>
                          <strong className="font-mono text-xs truncate block">{ins.claims_email}</strong>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-blue-700 group-hover:underline flex-shrink-0">Email &rarr;</span>
                    </a>
                  </div>

                  {/* Links & Verification Provenance */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px]">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{ins.verified_from_policy ? `Verified from ${ins.verified_from_policy}` : 'Verified IRDAI Registry'}</span>
                    </div>

                    {ins.cashless_portal_url && (
                      <a
                        href={ins.cashless_portal_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 transition-colors"
                      >
                        <span>Cashless Network Portal</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: INITIAL DOCUMENTS CHECKLIST (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div>
              <h4 className="font-black text-slate-900 text-sm tracking-tight flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-600" />
                <span>Claims Initial Document Checklists</span>
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Standardized requirements for rapid claim approval without surveyor query delays.
              </p>
            </div>

            {/* Checklist Category Tabs */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl">
              {[
                { id: 'health_reimbursement', label: '🏥 Health Claim' },
                { id: 'motor_accident_od', label: '🚗 Motor OD Claim' },
                { id: 'life_death_claim', label: '🛡️ Life Claim' },
                { id: 'home_property_claim', label: '🏠 Property Claim' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => {
                    setActiveChecklistKey(t.id as any);
                    setCheckedItems(new Set());
                  }}
                  className={`py-2 px-2.5 text-xs font-bold rounded-lg transition-all text-center cursor-pointer ${
                    activeChecklistKey === t.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Intimation Timeline Notice */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
              <Clock className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block text-[11px] uppercase tracking-wider text-amber-800">Intimation Rule:</strong>
                <p className="text-[11px] leading-relaxed text-amber-900">{currentChecklist.intimationTimeline}</p>
              </div>
            </div>

            {/* Items Checklist */}
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {currentChecklist.items.map(item => {
                const isChecked = checkedItems.has(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => handleToggleCheck(item.id)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-2.5 ${
                      isChecked
                        ? 'bg-emerald-50/50 border-emerald-300 text-slate-900'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/70'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-0 mt-0.5 cursor-pointer"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`font-bold ${isChecked ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                          {item.title}
                        </span>
                        {item.mandatory && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 uppercase">
                            Mandatory
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Copy for WhatsApp Action */}
            <button
              type="button"
              onClick={handleCopyWhatsApp}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Copy className="w-4 h-4" />
              <span>Copy Checklist for Client WhatsApp</span>
            </button>
          </div>
        </div>
      </div>

      {/* ADD / UPDATE INSURER MODAL */}
      {isAddInsurerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white max-w-xl w-full rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-150 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-lg text-slate-900">Add / Verify Insurer Contacts</h3>
              <button
                type="button"
                onClick={() => setIsAddInsurerModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveInsurer} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Company Registered Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Go Digit General Insurance Ltd."
                  value={editingInsurer.name}
                  onChange={e => setEditingInsurer(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Toll-free Claims Helpline *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1800-258-5956"
                    value={editingInsurer.claims_helpline_tollfree}
                    onChange={e => setEditingInsurer(prev => ({ ...prev, claims_helpline_tollfree: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Claims Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. claims@godigit.com"
                    value={editingInsurer.claims_email}
                    onChange={e => setEditingInsurer(prev => ({ ...prev, claims_email: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Customer Support Phone</label>
                  <input
                    type="text"
                    placeholder="e.g. 1800-258-4242"
                    value={editingInsurer.customer_support_phone}
                    onChange={e => setEditingInsurer(prev => ({ ...prev, customer_support_phone: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-mono text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">IRDAI Registration No.</label>
                  <input
                    type="text"
                    placeholder="e.g. 158"
                    value={editingInsurer.irda_reg_no}
                    onChange={e => setEditingInsurer(prev => ({ ...prev, irda_reg_no: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-mono text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Cashless Network Portal URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={editingInsurer.cashless_portal_url}
                  onChange={e => setEditingInsurer(prev => ({ ...prev, cashless_portal_url: e.target.value }))}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Head Office Address</label>
                <input
                  type="text"
                  placeholder="e.g. Atlantis, Koramangala, Bengaluru"
                  value={editingInsurer.head_office_address}
                  onChange={e => setEditingInsurer(prev => ({ ...prev, head_office_address: e.target.value }))}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900"
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddInsurerModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm transition-colors cursor-pointer"
                >
                  Save to Registry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
