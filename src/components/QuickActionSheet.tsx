import React from 'react';
import { X, ShieldCheck, TrendingUp, Building2, Search, Camera } from 'lucide-react';

interface QuickActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (action: 'upload_policy' | 'add_sip' | 'add_lead' | 'search') => void;
}

export const QuickActionSheet: React.FC<QuickActionSheetProps> = ({
  isOpen,
  onClose,
  onSelectAction
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end justify-center p-0 md:p-4 animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-t-3xl md:rounded-2xl p-5 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-extrabold text-white text-base">Quick Mobile Actions</h3>
            <p className="text-[11px] text-slate-400">Add or scan information directly from your phone</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Action 1: Upload Policy */}
          <button
            onClick={() => { onSelectAction('upload_policy'); onClose(); }}
            className="p-3.5 rounded-2xl bg-rose-950/30 hover:bg-rose-900/40 border border-rose-500/30 flex flex-col items-start gap-2 text-left transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-xs">Upload / Scan Policy</h4>
              <p className="text-[10px] text-rose-300/80 mt-0.5">Health, Motor & Term auto-extract</p>
            </div>
          </button>

          {/* Action 2: Add SIP */}
          <button
            onClick={() => { onSelectAction('add_sip'); onClose(); }}
            className="p-3.5 rounded-2xl bg-emerald-950/30 hover:bg-emerald-900/40 border border-emerald-500/30 flex flex-col items-start gap-2 text-left transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-xs">Add Mutual Fund SIP</h4>
              <p className="text-[10px] text-emerald-300/80 mt-0.5">New folio or mandate</p>
            </div>
          </button>

          {/* Action 3: Add Lead */}
          <button
            onClick={() => { onSelectAction('add_lead'); onClose(); }}
            className="p-3.5 rounded-2xl bg-blue-950/30 hover:bg-blue-900/40 border border-blue-500/30 flex flex-col items-start gap-2 text-left transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-xs">New MSME Lead</h4>
              <p className="text-[10px] text-blue-300/80 mt-0.5">Building material merchants</p>
            </div>
          </button>

          {/* Action 4: Global Search */}
          <button
            onClick={() => { onSelectAction('search'); onClose(); }}
            className="p-3.5 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700 flex flex-col items-start gap-2 text-left transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-slate-700/60 flex items-center justify-center text-slate-300 group-hover:scale-110 transition-transform">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-xs">Global Search</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Scan PAN, Name, Policy</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
