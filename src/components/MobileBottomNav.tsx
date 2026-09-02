import React from 'react';
import { LayoutDashboard, Shield, Plus, Heart, ShieldCheck, Users } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenQuickActions: () => void;
  pendingShieldCount: number;
  todayCelebrationCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenQuickActions,
  pendingShieldCount,
  todayCelebrationCount
}) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/80 px-2 py-1.5 flex items-center justify-around">
      {/* Cockpit */}
      <button
        onClick={() => setActiveTab('cockpit')}
        className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg transition-all ${
          activeTab === 'cockpit' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <LayoutDashboard className="w-5 h-5" />
        <span className="text-[10px]">Cockpit</span>
      </button>

      {/* SIP Shield */}
      <button
        onClick={() => setActiveTab('shield')}
        className={`relative flex flex-col items-center gap-1 py-1 px-2 rounded-lg transition-all ${
          activeTab === 'shield' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Shield className="w-5 h-5" />
        <span className="text-[10px]">Shield</span>
        {pendingShieldCount > 0 && (
          <span className="absolute top-0 right-1 w-4 h-4 rounded-full bg-amber-400 text-slate-950 text-[9px] font-black flex items-center justify-center">
            {pendingShieldCount}
          </span>
        )}
      </button>

      {/* Central Floating Quick Action (+) Button */}
      <button
        onClick={onOpenQuickActions}
        className="w-12 h-12 -mt-5 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/40 border-2 border-slate-950 active:scale-95 transition-all"
        title="Quick Add Action"
      >
        <Plus className="w-6 h-6 stroke-[2.5]" />
      </button>

      {/* Protection Vault */}
      <button
        onClick={() => setActiveTab('protection')}
        className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg transition-all ${
          activeTab === 'protection' ? 'text-rose-400 font-bold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <ShieldCheck className="w-5 h-5" />
        <span className="text-[10px]">Vault</span>
      </button>

      {/* Celebrations */}
      <button
        onClick={() => setActiveTab('celebrations')}
        className={`relative flex flex-col items-center gap-1 py-1 px-2 rounded-lg transition-all ${
          activeTab === 'celebrations' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Heart className="w-5 h-5" />
        <span className="text-[10px]">B'days</span>
        {todayCelebrationCount > 0 && (
          <span className="absolute top-0 right-1 w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
        )}
      </button>
    </div>
  );
};
