import React, { useState } from 'react';
import { X, Database, Save, Check, Terminal, RefreshCw } from 'lucide-react';
import { getSupabaseConfig, saveSupabaseConfig } from '../lib/supabase';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onManualSync: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onManualSync
}) => {
  const currentConfig = getSupabaseConfig() || { url: '', anonKey: '' };
  const [url, setUrl] = useState(currentConfig.url);
  const [key, setKey] = useState(currentConfig.anonKey);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    saveSupabaseConfig(url, key);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />
            <h3 className="font-black text-white text-base">Cockpit Settings & Bridge Status</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            1. Cloud Database Connection (Supabase)
          </h4>
          <p className="text-xs text-slate-400">
            Connect your 100% free-tier Supabase PostgreSQL project for cross-device mobile synchronization.
          </p>

          <div className="space-y-2">
            <label className="block text-[11px] font-semibold text-slate-400">Supabase Project URL</label>
            <input
              type="text"
              placeholder="https://xyzcompany.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full bg-slate-950 text-xs text-white p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[11px] font-semibold text-slate-400">Supabase Public Anon Key</label>
            <input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="w-full bg-slate-950 text-xs text-white p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/20"
            >
              {saved ? <Check className="w-4 h-4 text-white" /> : <Save className="w-4 h-4" />}
              <span>{saved ? 'Saved!' : 'Save Credentials'}</span>
            </button>
          </div>
        </div>

        <div className="space-y-3 pt-3 border-t border-slate-800">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Terminal className="w-4 h-4 text-amber-400" />
            2. Local Python Excel Bridge Daemon
          </h4>
          <p className="text-xs text-slate-400">
            The local daemon binds to active Excel (ANTFINSERV COCKPIT CRM.xlsm) via Windows COM with zero file locking.
          </p>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 space-y-1">
            <div className="text-slate-500"># Run bridge daemon on Windows:</div>
            <div className="text-emerald-400">cd bridge-daemon</div>
            <div className="text-emerald-400">run_bridge.bat</div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">Offline-First IndexedDB Active</span>
          <button
            onClick={() => { onManualSync(); onClose(); }}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 border border-slate-700"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
            <span>Force Sync Outbox</span>
          </button>
        </div>
      </div>
    </div>
  );
};
