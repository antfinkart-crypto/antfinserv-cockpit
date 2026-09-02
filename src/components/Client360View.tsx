import React, { useState } from 'react';
import { Users, Shield, TrendingUp, Phone, Mail, Award, AlertCircle, FileText, Sparkles, MessageSquare } from 'lucide-react';
import { Client, MfHolding, ActiveSip, ProtectionAsset } from '../types';
import { generateWhatsAppUrl } from '../lib/whatsAppRouter';

interface Client360ViewProps {
  clients: Client[];
  holdings: MfHolding[];
  sips: ActiveSip[];
  policies: ProtectionAsset[];
}

export const Client360View: React.FC<Client360ViewProps> = ({ clients, holdings, sips, policies }) => {
  // Derive list of unique clients from clients array + holdings + sips
  const allClients: { pan: string; name: string; mobile?: string }[] = [...clients.map(c => ({ pan: c.pan_number, name: c.full_name, mobile: c.mobile }))];

  // Also discover from holdings
  holdings.forEach(h => {
    if (h.pan && !allClients.some(c => c.pan === h.pan)) {
      allClients.push({ pan: h.pan, name: h.investor_name, mobile: '' });
    }
  });

  // Also discover from sips
  sips.forEach(s => {
    if (s.pan_number && !allClients.some(c => c.pan === s.pan_number)) {
      allClients.push({ pan: s.pan_number, name: s.investor_name, mobile: s.mobile });
    }
  });

  const [selectedPan, setSelectedPan] = useState<string>(allClients[0]?.pan || '');
  const activeClient = allClients.find(c => c.pan === selectedPan) || allClients[0];

  const clientHoldings = holdings.filter(h => h.pan === activeClient?.pan);
  const clientSips = sips.filter(s => s.pan_number === activeClient?.pan);
  const clientPolicies = policies.filter(p =>
    activeClient && p.client_name.toLowerCase().includes(activeClient.name.toLowerCase())
  );

  const totalHoldingAum = clientHoldings.reduce((sum, h) => sum + (h.current_value || 0), 0);
  const totalMonthlySip = clientSips.reduce((sum, s) => sum + (s.monthly_amount || 0), 0);
  const totalInsuranceCover = clientPolicies.reduce((sum, p) => sum + p.sum_insured, 0);

  const waMsg = activeClient ? `Dear ${activeClient.name}, your consolidated AntFinserv wealth portfolio: Holding AUM: ₹${totalHoldingAum.toLocaleString('en-IN')}, Monthly Active SIP: ₹${totalMonthlySip.toLocaleString('en-IN')}. Warm Regards, AntFinserv (ARN-94204).` : '';
  const waUrl = activeClient ? generateWhatsAppUrl(activeClient.mobile || '', waMsg) : '#';

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Users className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
                Client 360 & Household Relationship CRM
              </h2>
              <p className="text-xs md:text-sm text-slate-500 mt-0.5">
                Consolidated relationship view: Mutual Fund holdings, Active SIP mandates, Protection policies, and Household exposure.
              </p>
            </div>
          </div>
        </div>

        {/* Client Selector Dropdown */}
        {allClients.length > 0 && (
          <div className="flex items-center gap-2">
            <select
              value={selectedPan}
              onChange={e => setSelectedPan(e.target.value)}
              className="bg-white text-slate-900 font-bold text-xs md:text-sm p-3 md:p-3.5 rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500 shadow-sm min-w-[260px]"
            >
              {allClients.map(c => (
                <option key={c.pan} value={c.pan}>
                  {c.name} ({c.pan})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {allClients.length === 0 ? (
        <div className="glass-panel p-12 md:p-16 text-center rounded-2xl border border-slate-200 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
            <Users className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-xl font-bold text-slate-900">No Clients Registered Yet</h3>
            <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
              Clients and households are automatically populated when you upload mutual fund holding statements or active SIP reports.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Client Profile & Wealth Overview */}
          <div className="lg:col-span-4 space-y-6">
            <div className="glass-panel p-6 rounded-2xl border border-slate-200 space-y-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 uppercase">
                    Primary Investor
                  </span>
                  <h3 className="text-xl md:text-2xl font-black text-slate-900 mt-2">{activeClient.name}</h3>
                  <p className="text-xs md:text-sm text-slate-500 font-mono mt-0.5">PAN: {activeClient.pan}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-amber-700 text-lg shadow-sm">
                  {activeClient.name.charAt(0)}
                </div>
              </div>

              <div className="space-y-2.5 text-xs md:text-sm text-slate-600 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span>{activeClient.mobile || 'Contact not recorded'}</span>
                </div>
              </div>

              {activeClient.mobile && (
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Dispatch WhatsApp Summary</span>
                </a>
              )}
            </div>

            {/* Household Wealth Exposure */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
              <h4 className="font-bold text-sm md:text-base text-slate-900 flex items-center gap-2 uppercase tracking-wider">
                <Award className="w-4 h-4 text-amber-600" />
                <span>Household Wealth Footprint</span>
              </h4>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 font-medium">Mutual Fund AUM</span>
                    <p className="text-base md:text-xl font-black text-slate-900 mt-0.5">₹{totalHoldingAum.toLocaleString('en-IN')}</p>
                  </div>
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 font-medium">Monthly SIP Inflow</span>
                    <p className="text-base md:text-xl font-black text-amber-600 mt-0.5">₹{totalMonthlySip.toLocaleString('en-IN')}/mo</p>
                  </div>
                  <Sparkles className="w-5 h-5 text-amber-600" />
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 font-medium">Active Insurance Cover</span>
                    <p className="text-base md:text-xl font-black text-purple-700 mt-0.5">₹{totalInsuranceCover.toLocaleString('en-IN')}</p>
                  </div>
                  <Shield className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Holdings & Active SIPs Tables */}
          <div className="lg:col-span-8 space-y-6">
            {/* Holdings Section */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>Authoritative Portfolio Holdings ({clientHoldings.length})</span>
                </h4>
                <span className="text-xs md:text-sm text-emerald-700 font-black">₹{totalHoldingAum.toLocaleString('en-IN')}</span>
              </div>

              {clientHoldings.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-4 text-center">No holdings found in imported holding statement for this client.</p>
              ) : (
                <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                  {clientHoldings.map((h, i) => (
                    <div key={i} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs md:text-sm">
                      <div className="max-w-md">
                        <div className="font-bold text-slate-900 truncate" title={h.scheme_name}>{h.scheme_name}</div>
                        <div className="text-xs text-slate-500 font-mono">Folio: {h.folio_number} • {h.amc_name}</div>
                      </div>
                      <div className="text-right font-mono">
                        <div className="font-black text-slate-900">₹{h.current_value.toLocaleString('en-IN')}</div>
                        <div className="text-[11px] text-slate-500">Units: {h.holding_units.toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Active SIPs Section */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Ongoing Active SIP Mandates ({clientSips.length})</span>
                </h4>
                <span className="text-xs md:text-sm text-amber-700 font-black">₹{totalMonthlySip.toLocaleString('en-IN')}/mo</span>
              </div>

              {clientSips.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-4 text-center">No active SIP mandates found in imported SIP statement for this client.</p>
              ) : (
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {clientSips.map((s, i) => (
                    <div key={i} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs md:text-sm">
                      <div className="max-w-md">
                        <div className="font-bold text-slate-900 truncate" title={s.scheme_name}>{s.scheme_name}</div>
                        <div className="text-xs text-slate-500 font-mono">Folio: {s.folio_number} • Debit: {s.sip_date}th ({s.frequency})</div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-amber-600 font-mono">₹{s.monthly_amount.toLocaleString('en-IN')}</div>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                          s.holding_match_status === 'Matched' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>{s.holding_match_status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};