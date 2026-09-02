import React, { useState, useEffect } from 'react';
import { SipPortfolio, Lead, ProtectionAsset, Client } from '../types';
import { Search, X, ArrowRight, User, TrendingUp, ShieldCheck, Building2 } from 'lucide-react';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  sips: SipPortfolio[];
  leads: Lead[];
  policies: ProtectionAsset[];
  clients: Client[];
  onNavigate: (tab: string) => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  isOpen,
  onClose,
  sips,
  leads,
  policies,
  clients,
  onNavigate
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  const matchingClients = q ? clients.filter(c =>
    c.full_name.toLowerCase().includes(q) ||
    c.pan_number.toLowerCase().includes(q) ||
    c.mobile.includes(q) ||
    (c.firm_name && c.firm_name.toLowerCase().includes(q))
  ).slice(0, 5) : [];

  const matchingSips = q ? sips.filter(s =>
    (s.investor_name && s.investor_name.toLowerCase().includes(q)) ||
    (s.scheme_name && s.scheme_name.toLowerCase().includes(q)) ||
    (s.pan_number && s.pan_number.toLowerCase().includes(q)) ||
    (s.client_pan && s.client_pan.toLowerCase().includes(q)) ||
    (s.folio_number && s.folio_number.toLowerCase().includes(q))
  ).slice(0, 6) : [];

  const matchingLeads = q ? leads.filter(l =>
    l.firm_name.toLowerCase().includes(q) ||
    l.owner_name.toLowerCase().includes(q) ||
    l.mobile.includes(q) ||
    (l.pan_number && l.pan_number.toLowerCase().includes(q))
  ).slice(0, 5) : [];

  const matchingPolicies = q ? policies.filter(p =>
    p.client_name.toLowerCase().includes(q) ||
    p.policy_number.toLowerCase().includes(q) ||
    p.insurer.toLowerCase().includes(q) ||
    (p.primary_member_name && p.primary_member_name.toLowerCase().includes(q))
  ).slice(0, 5) : [];

  const totalMatches = matchingClients.length + matchingSips.length + matchingLeads.length + matchingPolicies.length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-start justify-center pt-16 px-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search across Name, PAN, Mobile, Policy No, Scheme..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {!query ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              Type to instantly search across all 156+ SIPs, B2B Leads, Protection Assets, and Client records.
            </div>
          ) : totalMatches === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              No results found matching &quot;{query}&quot;.
            </div>
          ) : (
            <>
              {matchingClients.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1">
                    <User className="w-3 h-3 text-emerald-400" />
                    Clients Master ({matchingClients.length})
                  </div>
                  {matchingClients.map(c => (
                    <div key={c.pan_number} className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-white">{c.full_name}</span>
                        <span className="text-[11px] text-slate-400 ml-2 font-mono">{c.pan_number} • {c.mobile}</span>
                      </div>
                      <button
                        onClick={() => { onNavigate('sips'); onClose(); }}
                        className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                      >
                        View <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {matchingSips.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-amber-400" />
                    Mutual Fund SIPs ({matchingSips.length})
                  </div>
                  {matchingSips.map((s, idx) => (
                    <div key={s.id || idx} className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
                      <div className="truncate mr-2">
                        <span className="font-bold text-white">{s.investor_name}</span>
                        <p className="text-[11px] text-slate-400 truncate">{s.scheme_name} (Due: {s.sip_due_day}th)</p>
                      </div>
                      <span className="font-bold text-amber-300 whitespace-nowrap">
                        ₹{s.monthly_amt.toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {matchingLeads.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-blue-400" />
                    B2B MSME Leads ({matchingLeads.length})
                  </div>
                  {matchingLeads.map(l => (
                    <div key={l.id} className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-white">{l.firm_name}</span>
                        <span className="text-[11px] text-slate-400 ml-2">{l.owner_name} ({l.status})</span>
                      </div>
                      <button
                        onClick={() => { onNavigate('pipeline'); onClose(); }}
                        className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
                      >
                        Pipeline <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {matchingPolicies.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-rose-400" />
                    Protection Vault ({matchingPolicies.length})
                  </div>
                  {matchingPolicies.map(p => (
                    <div key={p.id} className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-white">{p.client_name}</span>
                        <span className="text-[11px] text-slate-400 ml-2">{p.policy_type} ({p.policy_number})</span>
                      </div>
                      <button
                        onClick={() => { onNavigate('protection'); onClose(); }}
                        className="text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1"
                      >
                        Vault <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
