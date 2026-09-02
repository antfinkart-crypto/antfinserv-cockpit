import React, { useState } from 'react';
import { ProtectionAsset } from '../types';
import { ShieldCheck, Calendar, Upload } from 'lucide-react';
import { generateWhatsAppUrl } from '../lib/whatsAppRouter';

interface ProtectionVaultProps {
  policies: ProtectionAsset[];
  onOpenUploadModal: () => void;
}

export const ProtectionVault: React.FC<ProtectionVaultProps> = ({ policies, onOpenUploadModal }) => {
  const [filterType, setFilterType] = useState<string>('all');

  const filtered = policies.filter(p => {
    if (filterType === 'all') return true;
    return p.policy_type?.toLowerCase().includes(filterType.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
                Protection Vault & Insurance Matrix
              </h2>
              <p className="text-xs md:text-sm text-slate-500 mt-0.5">
                Client insurance portfolio tracking, renewal calendar, and family floater member coverage.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenUploadModal}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs md:text-sm flex items-center gap-2 shadow-sm transition-all"
          >
            <Upload className="w-4 h-4" />
            <span>Upload / Scan Policy</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      {policies.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {['all', 'Health', 'Motor', 'Term'].map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-4 py-2 text-xs md:text-sm rounded-xl font-bold transition-all ${
                filterType === t
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {t === 'all' ? `All Policies (${policies.length})` : t}
            </button>
          ))}
        </div>
      )}

      {/* Empty State */}
      {policies.length === 0 ? (
        <div className="glass-panel p-12 md:p-16 text-center rounded-2xl border border-slate-200 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-xl font-bold text-slate-900">No policies added yet.</h3>
            <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
              Upload or scan client insurance policy schedules (PDF / camera snapshot) to extract plan details, sum insured, renewal dates, and covered family members.
            </p>
          </div>
          <button
            onClick={onOpenUploadModal}
            className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs md:text-sm inline-flex items-center gap-2 shadow-sm transition-all mt-2"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Policy Document</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {filtered.map(pol => {
            const waMsg = `Dear ${pol.client_name}, this is regarding your ${pol.policy_type} policy (${pol.policy_number}) with ${pol.insurer}. Renewal date is ${pol.expiry_date}. Please let us know if you need assistance - AntFinserv (ARN-94204).`;
            const waUrl = generateWhatsAppUrl('', waMsg);

            return (
              <div
                key={pol.id}
                className="glass-panel p-6 rounded-2xl border border-slate-200 space-y-4 hover:border-slate-300 transition-all shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {pol.policy_type}
                    </span>
                    <h4 className="font-bold text-base md:text-lg text-slate-900 mt-2">{pol.client_name}</h4>
                    <p className="text-xs font-mono text-slate-500">{pol.policy_number}</p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                    {pol.insurer}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Sum Insured</span>
                    <p className="font-bold text-sm md:text-base text-slate-900">₹{pol.sum_insured.toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Net Premium</span>
                    <p className="font-bold text-sm md:text-base text-amber-600">₹{pol.net_premium.toLocaleString('en-IN')}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Expires: <strong>{pol.expiry_date}</strong></span>
                  </div>
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-emerald-700 font-bold hover:underline"
                  >
                    Send Reminder
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};