import React from 'react';
import { Shield, ShieldCheck, Heart, Newspaper, Home, TrendingUp, Search, RefreshCw, Settings, Users, LayoutDashboard } from 'lucide-react';

interface HeaderProps {
  isOnline: boolean;
  isSyncing: boolean;
  onSync: () => void;
  onOpenSettings: () => void;
  onOpenSearch: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pendingShieldCount: number;
  todayCelebrationCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  isOnline,
  isSyncing,
  onSync,
  onOpenSettings,
  onOpenSearch,
  activeTab,
  setActiveTab,
  pendingShieldCount,
  todayCelebrationCount
}) => {
  const tabs = [
    { id: 'cockpit', label: 'Cockpit', icon: LayoutDashboard },
    { id: 'client360', label: 'Client 360', icon: Users },
    { id: 'sips', label: 'Mutual Funds', icon: TrendingUp },
    { id: 'shield', label: 'SIP Shield', icon: Shield, badge: pendingShieldCount },
    { id: 'protection', label: 'Protection Vault', icon: ShieldCheck },
    { id: 'homeloan', label: 'Home Loans', icon: Home },
    { id: 'pipeline', label: 'New Leads / Prospects', icon: Users },
    { id: 'content', label: 'Content Studio', icon: Newspaper },
    { id: 'celebrations', label: 'Celebrations', icon: Heart, badge: todayCelebrationCount }
  ];

  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-30 shadow-sm">
      <div className="max-w-[92vw] 2xl:max-w-[1780px] mx-auto px-3 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        {/* Brand & AMFI ARN */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('cockpit')}>
          <div className="w-9 h-9 md:w-11 md:h-11 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 p-0.5 shadow-md flex-shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center font-black text-amber-400 text-sm tracking-tighter">
              ANT
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-sm md:text-lg lg:text-xl text-slate-900 tracking-tight">
                ANTFINSERV <span className="text-amber-600">COCKPIT</span>
              </h1>
              <span className="text-[10px] md:text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 font-bold border border-amber-200 hidden sm:inline-block">
                ARN-94204
              </span>
            </div>
            <p className="text-[10px] md:text-xs text-slate-500 hidden sm:block">Wealth & Business Operating System</p>
          </div>
        </div>

        {/* Global Controls & Sync */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSearch}
            className="py-2 md:py-2.5 px-3 md:px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center gap-2 text-xs md:text-sm transition-all"
            title="Search (⌘K)"
          >
            <Search className="w-4 h-4 text-slate-500" />
            <span className="hidden md:inline text-slate-600">Search PAN, Name...</span>
          </button>

          <button
            onClick={onSync}
            disabled={isSyncing}
            className="py-2 md:py-2.5 px-3 md:px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all flex items-center gap-2 text-xs md:text-sm font-semibold"
            title="Sync with Excel Bridge & Cloud"
          >
            <RefreshCw className={`w-4 h-4 text-amber-600 ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline text-slate-700 font-medium">Sync</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="p-2 md:p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all"
            title="Settings"
          >
            <Settings className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="max-w-[92vw] 2xl:max-w-[1780px] mx-auto px-3 sm:px-6 lg:px-8 flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2 text-xs md:text-sm font-semibold">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 md:px-4 py-2 md:py-2.5 rounded-xl whitespace-nowrap flex items-center gap-2 transition-all ${
                isActive
                  ? 'bg-amber-50 text-amber-800 font-bold border border-amber-300 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 md:w-4 md:h-4 ${isActive ? 'text-amber-600' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
};