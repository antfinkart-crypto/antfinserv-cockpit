import React, { useState } from 'react';
import { X, Save, AlertCircle, User, Phone, Mail, MapPin, Shield, Calendar } from 'lucide-react';
import { ClientMasterRecord, MappingRole, Gender } from '../types';

interface EditClientModalProps {
  client: ClientMasterRecord;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedClient: ClientMasterRecord) => Promise<void>;
}

export const EditClientModal: React.FC<EditClientModalProps> = ({
  client,
  isOpen,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<ClientMasterRecord>({ ...client });
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validate PAN format if provided
    if (formData.pan) {
      const cleanPan = formData.pan.trim().toUpperCase();
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleanPan)) {
        setErrorMsg('Invalid PAN format. PAN must be 10 characters (e.g. ABCDE1234F) or left blank for minors.');
        return;
      }
      formData.pan = cleanPan;
    } else {
      formData.pan = null; // A missing PAN is completely valid for minors!
    }

    // Clean mobile
    if (formData.mobile) {
      formData.mobile = formData.mobile.replace(/[\s\-()+]/g, '');
    }

    try {
      setIsSaving(true);
      const updated: ClientMasterRecord = {
        ...formData,
        is_manually_edited: true,
        updated_at: new Date().toISOString()
      };
      await onSave(updated);
      setIsSaving(false);
      onClose();
    } catch (err: any) {
      setIsSaving(false);
      setErrorMsg(err?.message || 'Failed to save client changes');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                Manual Edit
              </span>
              <span className="text-xs font-mono text-slate-400">ID: {client.client_id}</span>
            </div>
            <h3 className="text-xl font-black text-slate-900 mt-1">Edit Client Profile</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div className="m-6 mb-0 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Identity Section */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Identity & Family
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  value={formData.investor_name}
                  onChange={(e) => setFormData({ ...formData, investor_name: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  PAN Number <span className="text-slate-400 font-normal">(Leave blank for minors)</span>
                </label>
                <input
                  type="text"
                  maxLength={10}
                  placeholder="e.g. ABCDE1234F or blank"
                  value={formData.pan || ''}
                  onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 font-mono font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Date of Birth (DOB)</label>
                <input
                  type="date"
                  value={formData.dob || ''}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value || null })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Gender</label>
                <select
                  value={formData.gender || 'Not Specified'}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 font-medium bg-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Not Specified">Not Specified</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Family Role</label>
                <select
                  value={formData.mapping_role}
                  onChange={(e) => setFormData({ ...formData, mapping_role: e.target.value as MappingRole })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 font-medium bg-white"
                >
                  <option value="Head">Family Head</option>
                  <option value="Member">Family Member</option>
                  <option value="Individual">Individual</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Family ID <span className="text-slate-400 font-normal">(Head's USERID)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. H100"
                  value={formData.family_id || ''}
                  onChange={(e) => setFormData({ ...formData, family_id: e.target.value.trim() })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" /> Contact Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Mobile Number</label>
                <input
                  type="text"
                  value={formData.mobile || ''}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  placeholder="10-digit mobile"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address</label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase() })}
                  placeholder="client@example.com"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Address Section */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> Address & Location
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Address Lines</label>
                <input
                  type="text"
                  placeholder="Street / Building / Flat"
                  value={formData.address_line_1 || ''}
                  onChange={(e) => setFormData({ ...formData, address_line_1: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 mb-2"
                />
                <input
                  type="text"
                  placeholder="Locality / Area"
                  value={formData.address_line_2 || ''}
                  onChange={(e) => setFormData({ ...formData, address_line_2: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">City</label>
                <input
                  type="text"
                  value={formData.city || ''}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Pincode</label>
                <input
                  type="text"
                  maxLength={6}
                  value={formData.pincode || ''}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">State</label>
                <input
                  type="text"
                  value={formData.state || ''}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Relationship Manager Section */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" /> Distribution & RM
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">RM Name</label>
                <input
                  type="text"
                  value={formData.rm_name || ''}
                  onChange={(e) => setFormData({ ...formData, rm_name: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Associate Name</label>
                <input
                  type="text"
                  value={formData.associate_name || ''}
                  onChange={(e) => setFormData({ ...formData, associate_name: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Branch</label>
                <input
                  type="text"
                  value={formData.branch || ''}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
