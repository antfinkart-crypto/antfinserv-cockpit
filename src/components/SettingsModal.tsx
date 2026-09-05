import React, { useState } from 'react';
import {
  X,
  Database,
  Save,
  Check,
  Terminal,
  RefreshCw,
  Shield,
  KeyRound,
  Lock,
  Clock,
  Copy,
  AlertTriangle
} from 'lucide-react';
import { getSupabaseConfig, saveSupabaseConfig } from '../lib/supabase';
import {
  updateMasterPassword,
  updatePin,
  getAutoLockMinutes,
  setAutoLockMinutes
} from '../lib/security';

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
  const [activeTab, setActiveTab] = useState<'cloud' | 'security'>('security');

  // Cloud Config State
  const currentConfig = getSupabaseConfig() || { url: '', anonKey: '' };
  const [url, setUrl] = useState(currentConfig.url);
  const [key, setKey] = useState(currentConfig.anonKey);
  const [cloudSaved, setCloudSaved] = useState(false);

  // Security Config State
  const [currPassword, setCurrPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPin, setNewPin] = useState('');
  const [autoLockMins, setAutoLockMinsState] = useState<number>(() => getAutoLockMinutes());
  const [securityMsg, setSecurityMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSaveCloud = () => {
    saveSupabaseConfig(url, key);
    setCloudSaved(true);
    setTimeout(() => {
      setCloudSaved(false);
      onClose();
    }, 1200);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityMsg(null);

    if (newPassword !== confirmPassword) {
      setSecurityMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    const res = await updateMasterPassword(currPassword, newPassword);
    if (res.success) {
      setSecurityMsg({ type: 'success', text: 'Master Password updated successfully!' });
      setCurrPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setSecurityMsg({ type: 'error', text: res.error || 'Failed to update password.' });
    }
  };

  const handleUpdatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityMsg(null);

    const res = await updatePin(newPin);
    if (res.success) {
      setSecurityMsg({ type: 'success', text: 'Quick 6-Digit PIN updated successfully!' });
      setNewPin('');
    } else {
      setSecurityMsg({ type: 'error', text: res.error || 'PIN must be exactly 6 numeric digits.' });
    }
  };

  const handleAutoLockChange = (mins: number) => {
    setAutoLockMinsState(mins);
    setAutoLockMinutes(mins);
    setSecurityMsg({ type: 'success', text: `Auto-lock interval set to ${mins > 0 ? `${mins} minutes` : 'Disabled'}.` });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 space-y-5 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">Cockpit Settings & Vault Access</h3>
              <p className="text-xs text-slate-400">Security Gatekeeper & Database Config</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('security')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'security'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            Security & Vault Access
          </button>
          <button
            onClick={() => setActiveTab('cloud')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'cloud'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Cloud & Excel Bridge
          </button>
        </div>

        {/* TAB 1: SECURITY & ACCESS CONTROL */}
        {activeTab === 'security' && (
          <div className="space-y-5">
            {/* Feedback Message */}
            {securityMsg && (
              <div
                className={`p-3 rounded-xl border text-xs font-medium flex items-center gap-2 ${
                  securityMsg.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                }`}
              >
                {securityMsg.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                <span>{securityMsg.text}</span>
              </div>
            )}

            {/* Auto-Lock Timer Selection */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <label className="text-xs font-bold text-slate-200">Inactivity Auto-Lock</label>
                </div>
                <span className="text-xs font-bold text-amber-400">
                  {autoLockMins > 0 ? `${autoLockMins} Minutes` : 'Disabled'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Automatically hides confidential client data behind the lock screen when idle.
              </p>
              <div className="grid grid-cols-4 gap-2 pt-1">
                {[5, 15, 30, 0].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleAutoLockChange(val)}
                    className={`py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      autoLockMins === val
                        ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold shadow-xs'
                        : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    {val === 0 ? 'Never' : `${val}m`}
                  </button>
                ))}
              </div>
            </div>

            {/* Update Quick 6-Digit PIN */}
            <form onSubmit={handleUpdatePin} className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold text-slate-200">Update Quick 6-Digit PIN</h4>
              </div>
              <p className="text-[11px] text-slate-400">
                Used for rapid 1-tap mobile unlock on trusted devices.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={newPin}
                  onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="New 6-Digit PIN (e.g. 942040)"
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-hidden focus:border-amber-500"
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-xs transition-colors"
                >
                  Save PIN
                </button>
              </div>
            </form>

            {/* Update Master Password */}
            <form onSubmit={handleUpdatePassword} className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold text-slate-200">Change Master Password</h4>
              </div>
              <div className="space-y-2">
                <input
                  type="password"
                  value={currPassword}
                  onChange={e => setCurrPassword(e.target.value)}
                  placeholder="Current Master Password"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-hidden focus:border-amber-500"
                  required
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="New Password (min 8)"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-hidden focus:border-amber-500"
                    required
                  />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Confirm New Password"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-hidden focus:border-amber-500"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-colors"
              >
                Update Master Password
              </button>
            </form>

            {/* Security Notice */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                Two-Tier Institutional Security Active
              </span>
              <p className="text-[11px] text-slate-400">
                Your credentials and encrypted vault are safeguarded behind PBKDF2 hashed storage. Use your offline emergency master key if device lockout recovery is required.
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: CLOUD & EXCEL BRIDGE */}
        {activeTab === 'cloud' && (
          <div className="space-y-5">
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
                  className="w-full bg-slate-950 text-xs text-white p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-semibold text-slate-400">Supabase Public Anon Key</label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  className="w-full bg-slate-950 text-xs text-white p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  onClick={handleSaveCloud}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/20"
                >
                  {cloudSaved ? <Check className="w-4 h-4 text-white" /> : <Save className="w-4 h-4" />}
                  <span>{cloudSaved ? 'Saved!' : 'Save Credentials'}</span>
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
        )}
      </div>
    </div>
  );
};
