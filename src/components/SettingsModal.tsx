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
  AlertTriangle,
  Smartphone,
  Laptop,
  ArrowLeftRight,
  Download,
  UploadCloud,
  Share2,
  FileCheck
} from 'lucide-react';
import { getSupabaseConfig, saveSupabaseConfig } from '../lib/supabase';
import {
  updateMasterPassword,
  updatePin,
  getAutoLockMinutes,
  setAutoLockMinutes
} from '../lib/security';
import {
  exportDeviceSyncBundle,
  importDeviceSyncBundle,
  performSupabaseCloudSync
} from '../lib/deviceSync';

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
  const [activeTab, setActiveTab] = useState<'security' | 'devicesync' | 'cloud'>('security');

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

  // Device Sync State
  const [syncCode, setSyncCode] = useState('');
  const [importCode, setImportCode] = useState('');
  const [syncStatus, setSyncStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isCopiedBundle, setIsCopiedBundle] = useState(false);

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

  // Device Sync Handlers
  const handleExportBundle = async () => {
    try {
      setIsExporting(true);
      setSyncStatus(null);
      const bundle = await exportDeviceSyncBundle();
      setSyncCode(bundle);
      setIsExporting(false);
      setSyncStatus({ type: 'success', message: 'Sync bundle generated! Copy the text or download the JSON file.' });
    } catch (e: any) {
      setIsExporting(false);
      setSyncStatus({ type: 'error', message: e.message || 'Export failed.' });
    }
  };

  const handleCopyBundle = async () => {
    if (!syncCode) return;
    try {
      await navigator.clipboard.writeText(syncCode);
      setIsCopiedBundle(true);
      setTimeout(() => setIsCopiedBundle(false), 3000);
    } catch {
      alert('Could not auto-copy. Please select and copy the text in the box.');
    }
  };

  const handleDownloadBundle = () => {
    if (!syncCode) return;
    const blob = new Blob([syncCode], { type: 'application/json' });
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `antfinserv-sync-bundle-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(downloadUrl);
  };

  const handleImportBundle = async () => {
    if (!importCode.trim()) {
      setSyncStatus({ type: 'error', message: 'Please paste your sync code into the box first.' });
      return;
    }
    try {
      setIsImporting(true);
      setSyncStatus(null);
      const res = await importDeviceSyncBundle(importCode.trim());
      setIsImporting(false);
      if (res.success) {
        setSyncStatus({ type: 'success', message: res.message + ' Refreshing workspace...' });
        setImportCode('');
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        setSyncStatus({ type: 'error', message: res.message });
      }
    } catch (e: any) {
      setIsImporting(false);
      setSyncStatus({ type: 'error', message: e.message || 'Import failed.' });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setImportCode(content);
      }
    };
    reader.readAsText(file);
  };

  const handleCloudSyncNow = async () => {
    setSyncStatus({ type: 'success', message: 'Contacting Supabase Cloud...' });
    const res = await performSupabaseCloudSync();
    if (res.success) {
      setSyncStatus({ type: 'success', message: res.message });
    } else {
      setSyncStatus({ type: 'error', message: res.message });
    }
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
              <p className="text-xs text-slate-400">Security Gatekeeper & Database Sync Hub</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1">
          <button
            onClick={() => setActiveTab('security')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'security'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Security & Gatekeeper</span>
          </button>
          <button
            onClick={() => setActiveTab('devicesync')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'devicesync'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Phone ⇄ Desktop Sync</span>
          </button>
          <button
            onClick={() => setActiveTab('cloud')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'cloud'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Cloud & Excel</span>
          </button>
        </div>

        {/* TAB 1: SECURITY & ACCESS CONTROL */}
        {activeTab === 'security' && (
          <div className="space-y-5">
            {/* Feedback Message */}
            {securityMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  securityMsg.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}
              >
                {securityMsg.type === 'success' ? (
                  <Check className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                )}
                <span>{securityMsg.text}</span>
              </div>
            )}

            {/* Auto-Lock Settings */}
            <div className="space-y-2.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Auto-Lock Timeout (Inactivity)</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: '5 Mins', val: 5 },
                  { label: '15 Mins', val: 15 },
                  { label: '30 Mins', val: 30 },
                  { label: 'Off', val: 0 }
                ].map(({ label, val }) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleAutoLockChange(val)}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      autoLockMins === val
                        ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Update Master Password */}
            <form onSubmit={handleUpdatePassword} className="space-y-3 pt-3 border-t border-slate-800">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span>Change Master Password</span>
              </label>

              <div className="space-y-2">
                <input
                  type="password"
                  placeholder="Current Master Password"
                  value={currPassword}
                  onChange={(e) => setCurrPassword(e.target.value)}
                  className="w-full bg-slate-950 text-xs text-white p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500 font-mono"
                  required
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="password"
                    placeholder="New Master Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-slate-950 text-xs text-white p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500 font-mono"
                    required
                  />
                  <input
                    type="password"
                    placeholder="Confirm New Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-slate-950 text-xs text-white p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Update Password</span>
                </button>
              </div>
            </form>

            {/* Update 6-Digit PIN */}
            <form onSubmit={handleUpdatePin} className="space-y-3 pt-3 border-t border-slate-800">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-amber-400" />
                <span>Change Quick 6-Digit PIN</span>
              </label>

              <div className="flex items-center gap-2">
                <input
                  type="password"
                  maxLength={6}
                  pattern="\\d{6}"
                  placeholder="Enter 6 digits (e.g. 942041)"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  className="flex-1 bg-slate-950 text-xs text-white p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500 font-mono tracking-widest text-center"
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all border border-slate-700 cursor-pointer"
                >
                  <Save className="w-4 h-4 text-amber-400" />
                  <span>Save PIN</span>
                </button>
              </div>
            </form>

            {/* Institutional Security Notice */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
              <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1">
                <Shield className="w-3 h-3" />
                <span>Zero-Trust Architecture Active</span>
              </span>
              <p className="text-[11px] text-slate-400">
                Your credentials and encrypted vault are safeguarded behind PBKDF2 hashed storage. Use your offline emergency master key if device lockout recovery is required.
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: DEVICE-TO-DEVICE SYNC HUB */}
        {activeTab === 'devicesync' && (
          <div className="space-y-4">
            {syncStatus && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  syncStatus.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}
              >
                {syncStatus.type === 'success' ? (
                  <Check className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                )}
                <span>{syncStatus.message}</span>
              </div>
            )}

            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed flex items-start gap-2.5">
              <ArrowLeftRight className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>Cross-Device Data Transfer:</strong> Since AntFinServ Cockpit runs in your browser's local sandbox, data created on your Phone (like new leads or birthday greetings) can be transferred to your Desktop in one tap.
              </div>
            </div>

            {/* STEP 1: EXPORT (RUN ON SOURCE DEVICE) */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Step 1 (Source Device)</span>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5 mt-0.5">
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    <span>Export Data from this Device</span>
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={handleExportBundle}
                  disabled={isExporting}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{isExporting ? 'Packaging...' : 'Generate Sync Code'}</span>
                </button>
              </div>

              {syncCode && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <textarea
                    readOnly
                    value={syncCode}
                    rows={4}
                    className="w-full bg-slate-900 text-[11px] font-mono text-emerald-300 p-2.5 rounded-xl border border-slate-800 focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleCopyBundle}
                      className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5 text-amber-400" />
                      <span>{isCopiedBundle ? 'Copied to Clipboard!' : 'Copy Sync Code'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadBundle}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Download JSON</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* STEP 2: IMPORT (RUN ON TARGET DEVICE) */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">Step 2 (Target Device)</span>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5 mt-0.5">
                    <Laptop className="w-4 h-4 text-blue-400" />
                    <span>Import & Merge onto this Device</span>
                  </h4>
                </div>
              </div>

              <textarea
                placeholder="Paste the Sync Code copied from your other device here..."
                value={importCode}
                onChange={e => setImportCode(e.target.value)}
                rows={3}
                className="w-full bg-slate-900 text-xs text-white p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-blue-500 font-mono"
              />

              <div className="flex items-center justify-between gap-2">
                <label className="text-[11px] font-semibold text-slate-400 hover:text-slate-200 cursor-pointer flex items-center gap-1">
                  <UploadCloud className="w-3.5 h-3.5 text-slate-400" />
                  <span>Or upload .json file</span>
                  <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                </label>

                <button
                  type="button"
                  onClick={handleImportBundle}
                  disabled={isImporting}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>{isImporting ? 'Merging...' : 'Merge & Update Desktop'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CLOUD & EXCEL BRIDGE */}
        {activeTab === 'cloud' && (
          <div className="space-y-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  1. Supabase Cloud PostgreSQL
                </h4>
                {url && key && (
                  <button
                    type="button"
                    onClick={handleCloudSyncNow}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Sync Cloud Now</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Connect your 100% free-tier Supabase PostgreSQL project for continuous automatic multi-device synchronization.
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
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  {cloudSaved ? <Check className="w-4 h-4 text-white" /> : <Save className="w-4 h-4" />}
                  <span>{cloudSaved ? 'Saved!' : 'Save Credentials'}</span>
                </button>
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-800">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-amber-400" />
                <span>2. Local Python Excel Bridge Daemon</span>
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
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 border border-slate-700 cursor-pointer"
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
