import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  Heart,
  Newspaper,
  Home,
  TrendingUp,
  Search,
  RefreshCw,
  Settings,
  Users,
  LayoutDashboard,
  GripVertical,
  Lock
} from 'lucide-react';
import { useAuth } from './AuthGate';

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
  reviewQueueCount?: number;
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
  todayCelebrationCount,
  reviewQueueCount = 0
}) => {
  const { lockCockpit } = useAuth();
  const ALL_TABS = [
    { id: 'cockpit', label: 'Cockpit', icon: LayoutDashboard },
    { id: 'content', label: 'Content Studio', icon: Newspaper, isFestive: true },
    { id: 'client360', label: 'Client Master', icon: Users, badge: reviewQueueCount },
    { id: 'sips', label: 'Mutual Funds', icon: TrendingUp },
    { id: 'shield', label: 'SIP Shield', icon: Shield, badge: pendingShieldCount },
    { id: 'homeloan', label: 'Home Loans', icon: Home },
    { id: 'pipeline', label: 'New Leads / Prospects', icon: Users },
    { id: 'protection', label: 'Protection Vault', icon: ShieldCheck }
  ];

  const [tabOrder, setTabOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('antos_tab_order_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter(id => id !== 'celebrations' && ALL_TABS.some(t => t.id === id));
          if (cleaned.length === ALL_TABS.length) return cleaned;
        }
      }
    } catch {}
    return ALL_TABS.map(t => t.id);
  });

  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);

  const orderedTabs = tabOrder
    .map(id => ALL_TABS.find(t => t.id === id))
    .filter(Boolean) as typeof ALL_TABS;

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedTabId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedTabId || draggedTabId === targetId) return;

    const newOrder = [...tabOrder];
    const dragIdx = newOrder.indexOf(draggedTabId);
    const targetIdx = newOrder.indexOf(targetId);

    newOrder.splice(dragIdx, 1);
    newOrder.splice(targetIdx, 0, draggedTabId);

    setTabOrder(newOrder);
    try {
      localStorage.setItem('antos_tab_order_v2', JSON.stringify(newOrder));
    } catch {}
    setDraggedTabId(null);
  };

  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-30 shadow-xs">
      <div className="max-w-[92vw] 2xl:max-w-[1780px] mx-auto px-3 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        {/* Brand & AMFI ARN */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('cockpit')}>
          <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl overflow-hidden border border-amber-500/30 shadow-xs flex-shrink-0 bg-slate-950 p-0.5">
            <img src="./emblem-logo.jpg" alt="AntFinServ Mascot" className="w-full h-full object-contain" />
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

        {/* Top Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onOpenSearch}
            className="p-2 md:py-2 md:px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all flex items-center gap-2 text-xs md:text-sm font-medium"
            title="Global Search"
          >
            <Search className="w-4 h-4 text-slate-500" />
            <span className="hidden md:inline">Search (Ctrl+K)</span>
          </button>

          <button
            onClick={onSync}
            disabled={isSyncing}
            className="py-2 md:py-2.5 px-3 md:px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all flex items-center gap-2 text-xs md:text-sm font-semibold cursor-pointer"
            title="Sync with Excel Bridge & Cloud"
          >
            <RefreshCw className={`w-4 h-4 text-amber-600 ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline text-slate-700 font-medium">Sync</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="p-2 md:py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all cursor-pointer"
            title="Settings"
          >
            <Settings className="w-4 h-4 text-slate-500" />
          </button>

          <button
            onClick={lockCockpit}
            className="p-2 md:py-2 md:px-3 rounded-xl bg-amber-50 hover:bg-rose-50 text-amber-900 hover:text-rose-700 border border-amber-300/80 hover:border-rose-300 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
            title="Lock Cockpit (Vault Gatekeeper)"
          >
            <Lock className="w-4 h-4 text-amber-700 hover:text-rose-600" />
            <span className="hidden sm:inline text-xs font-bold text-amber-900 hover:text-rose-700">Lock</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs (Draggable & Reorderable) */}
      <nav className="max-w-[92vw] 2xl:max-w-[1780px] mx-auto px-3 sm:px-6 lg:px-8 flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2 text-xs md:text-sm font-semibold">
        {orderedTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              draggable
              onDragStart={e => handleDragStart(e, tab.id)}
              onDragOver={handleDragOver}
              onDrop={e => handleDrop(e, tab.id)}
              onClick={() => setActiveTab(tab.id)}
              title="Drag to reorder tab"
              className={`px-3 md:px-4 py-2 md:py-2.5 rounded-xl whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer select-none active:scale-98 ${
                isActive
                  ? 'bg-amber-50 text-amber-800 font-bold border border-amber-300 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              } ${tab.isFestive && !isActive ? 'bg-amber-500/10 text-amber-900 border border-amber-300/60' : ''}`}
            >
              <GripVertical className="w-3 h-3 text-slate-300 -ml-1 cursor-grab hidden sm:inline-block" />
              <Icon className={`w-3.5 h-3.5 md:w-4 md:h-4 ${isActive ? 'text-amber-600' : tab.isFestive ? 'text-amber-600' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.isFestive && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              )}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
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
