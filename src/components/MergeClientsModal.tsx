import React, { useState, useMemo } from 'react';
import { X, GitMerge, Check, AlertTriangle, Shield, User, Phone, Mail, MapPin, Calendar, TrendingUp } from 'lucide-react';
import { ClientMasterRecord } from '../types';

interface MergeClientsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClients?: ClientMasterRecord[];
  allClients: ClientMasterRecord[];
  onMerge: (
    primaryClientId: string,
    secondaryClientIds: string[],
    consolidatedData: Partial<ClientMasterRecord>
  ) => Promise<void>;
}

export const MergeClientsModal: React.FC<MergeClientsModalProps> = ({
  isOpen,
  onClose,
  selectedClients = [],
  allClients,
  onMerge
}) => {
  // If fewer than 2 clients provided, allow picking
  const [primaryId, setPrimaryId] = useState<string>(() => {
    if (selectedClients.length > 0) {
      // Prioritize client with longer name or non-empty PAN
      const sorted = [...selectedClients].sort((a, b) => {
        if (a.pan && !b.pan) return -1;
        if (!a.pan && b.pan) return 1;
        return (b.investor_name?.length || 0) - (a.investor_name?.length || 0);
      });
      return sorted[0].client_id;
    }
    return '';
  });

  const [secondaryId, setSecondaryId] = useState<string>(() => {
    if (selectedClients.length > 1) {
      const remaining = selectedClients.filter(c => c.client_id !== primaryId);
      return remaining[0]?.client_id || '';
    }
    return '';
  });

  const primaryClient = useMemo(() => {
    return allClients.find(c => c.client_id === primaryId) || null;
  }, [allClients, primaryId]);

  const secondaryClient = useMemo(() => {
    return allClients.find(c => c.client_id === secondaryId) || null;
  }, [allClients, secondaryId]);

  // Consolidated Form Selections
  const [chosenName, setChosenName] = useState('');
  const [chosenPan, setChosenPan] = useState('');
  const [chosenDob, setChosenDob] = useState('');
  const [chosenGender, setChosenGender] = useState('');
  const [chosenMobile, setChosenMobile] = useState('');
  const [chosenEmail, setChosenEmail] = useState('');
  const [chosenAddress, setChosenAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize values when clients change
  React.useEffect(() => {
    if (primaryClient) {
      // Pick best name (longest and not abbreviated)
      const name = (secondaryClient?.investor_name && secondaryClient.investor_name.length > (primaryClient.investor_name?.length || 0) && !secondaryClient.investor_name.includes('.'))
        ? secondaryClient.investor_name
        : primaryClient.investor_name;
      setChosenName(name || '');

      // Pick valid PAN
      setChosenPan(primaryClient.pan || secondaryClient?.pan || '');

      // Pick DOB
      setChosenDob(primaryClient.dob || secondaryClient?.dob || '');

      // Pick Gender
      const g = (primaryClient.gender && primaryClient.gender !== 'Not Specified')
        ? primaryClient.gender
        : (secondaryClient?.gender || 'Not Specified');
      setChosenGender(g);

      // Pick Mobile
      setChosenMobile(primaryClient.mobile || secondaryClient?.mobile || '');

      // Pick Email
      setChosenEmail(primaryClient.email || secondaryClient?.email || '');

      // Pick Address
      setChosenAddress(primaryClient.address_line_1 || secondaryClient?.address_line_1 || '');
    }
  }, [primaryClient, secondaryClient]);

  if (!isOpen) return null;

  const handleSwap = () => {
    const temp = primaryId;
    setPrimaryId(secondaryId);
    setSecondaryId(temp);
  };

  const handleExecuteMerge = async () => {
    if (!primaryClient || !secondaryClient) {
      alert('Please select both a Primary surviving client and a Duplicate client to merge.');
      return;
    }
    if (primaryId === secondaryId) {
      alert('Primary client and duplicate client cannot be the same record.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onMerge(
        primaryId,
        [secondaryId],
        {
          investor_name: chosenName.trim(),
          pan: chosenPan.trim().toUpperCase() || null,
          dob: chosenDob || null,
          gender: chosenGender as any,
          mobile: chosenMobile.trim(),
          email: chosenEmail.trim(),
          address_line_1: chosenAddress.trim()
        }
      );
      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      alert('Failed to merge client profiles: ' + err?.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white max-w-2xl w-full rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-5 my-8">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-200 shadow-xs">
              <GitMerge className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Merge Duplicate Client Profiles</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Consolidate records globally across Client Master, Insurance Policies, Floaters, and MF Holdings.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Client Selection Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Primary Profile */}
          <div className="p-4 rounded-2xl border-2 border-emerald-500/40 bg-emerald-50/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-600 text-white">
                Primary Profile (Surviving)
              </span>
            </div>
            <select
              value={primaryId}
              onChange={e => setPrimaryId(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-emerald-300 bg-white text-xs font-bold text-slate-900 focus:outline-hidden"
            >
              <option value="">-- Choose Primary Profile --</option>
              {allClients.map(c => (
                <option key={c.client_id} value={c.client_id}>
                  {c.investor_name} {c.pan ? `(${c.pan})` : ''} - ID: {c.client_id}
                </option>
              ))}
            </select>
            {primaryClient && (
              <div className="text-[11px] text-slate-600 space-y-0.5 pt-1">
                <p><strong>PAN:</strong> {primaryClient.pan || 'N/A'} • <strong>Mobile:</strong> {primaryClient.mobile || 'N/A'}</p>
                <p><strong>DOB:</strong> {primaryClient.dob || 'N/A'} • <strong>Gender:</strong> {primaryClient.gender}</p>
                <p className="truncate"><strong>Address:</strong> {primaryClient.address_line_1 || 'N/A'}</p>
              </div>
            )}
          </div>

          {/* Secondary / Duplicate Profile */}
          <div className="p-4 rounded-2xl border-2 border-rose-300 bg-rose-50/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-rose-600 text-white">
                Duplicate Profile (To Retire)
              </span>
            </div>
            <select
              value={secondaryId}
              onChange={e => setSecondaryId(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-rose-300 bg-white text-xs font-bold text-slate-900 focus:outline-hidden"
            >
              <option value="">-- Choose Duplicate to Merge --</option>
              {allClients.filter(c => c.client_id !== primaryId).map(c => (
                <option key={c.client_id} value={c.client_id}>
                  {c.investor_name} {c.pan ? `(${c.pan})` : ''} - ID: {c.client_id}
                </option>
              ))}
            </select>
            {secondaryClient && (
              <div className="text-[11px] text-slate-600 space-y-0.5 pt-1">
                <p><strong>PAN:</strong> {secondaryClient.pan || 'N/A'} • <strong>Mobile:</strong> {secondaryClient.mobile || 'N/A'}</p>
                <p><strong>DOB:</strong> {secondaryClient.dob || 'N/A'} • <strong>Gender:</strong> {secondaryClient.gender}</p>
                <p className="truncate"><strong>Address:</strong> {secondaryClient.address_line_1 || 'N/A'}</p>
              </div>
            )}
          </div>
        </div>

        {/* Swap Button */}
        {primaryClient && secondaryClient && (
          <div className="flex justify-center -my-2">
            <button
              type="button"
              onClick={handleSwap}
              className="px-3 py-1 text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
            >
              ⇄ Swap Primary & Duplicate
            </button>
          </div>
        )}

        {/* Consolidated Fields Chooser */}
        {primaryClient && secondaryClient && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
              Consolidated Profile Blueprint
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Surviving Investor Name</label>
                <input
                  type="text"
                  value={chosenName}
                  onChange={e => setChosenName(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Surviving PAN Number</label>
                <input
                  type="text"
                  value={chosenPan}
                  onChange={e => setChosenPan(e.target.value.toUpperCase())}
                  placeholder="e.g. ADLPA7633H"
                  className="w-full p-2 rounded-xl border border-slate-300 bg-white font-mono font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Contact Mobile</label>
                <input
                  type="text"
                  value={chosenMobile}
                  onChange={e => setChosenMobile(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-300 bg-white font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Email Address</label>
                <input
                  type="email"
                  value={chosenEmail}
                  onChange={e => setChosenEmail(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-300 bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Date of Birth (YYYY-MM-DD)</label>
                <input
                  type="date"
                  value={chosenDob}
                  onChange={e => setChosenDob(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-300 bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Gender</label>
                <select
                  value={chosenGender}
                  onChange={e => setChosenGender(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-300 bg-white text-slate-900"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Not Specified">Not Specified</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Residential Premises Address</label>
                <input
                  type="text"
                  value={chosenAddress}
                  onChange={e => setChosenAddress(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-300 bg-white text-slate-900"
                />
              </div>
            </div>
          </div>
        )}

        {/* Global Impact Summary */}
        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-950 flex items-start gap-2.5">
          <Shield className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold block">Automatic Global System Cascade:</span>
            <p className="text-[11px] text-indigo-800 leading-relaxed">
              Upon confirmation, all policies, health floater members, mutual fund holdings, SIP mandates, and CRM leads linked to <strong>{secondaryClient?.investor_name || 'the duplicate'}</strong> will be permanently re-linked to <strong>{primaryClient?.investor_name || 'the primary'}</strong>. The duplicate record will be purged from the database.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!primaryClient || !secondaryClient || isSubmitting}
            onClick={handleExecuteMerge}
            className="flex-1 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <GitMerge className="w-4 h-4" />
            <span>{isSubmitting ? 'Merging Across CRM...' : 'Confirm & Execute Global Merge'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
