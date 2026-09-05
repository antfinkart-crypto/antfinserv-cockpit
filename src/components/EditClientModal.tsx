import React, { useState } from 'react';
import { X, Save, AlertCircle, User, Phone, Mail, MapPin, Shield, Calendar, Trash2, Layers, Plus } from 'lucide-react';
import { ClientMasterRecord, MappingRole, Gender } from '../types';
import { STANDARD_PRODUCTS } from '../lib/clientProductClassifier';

interface EditClientModalProps {
  client: ClientMasterRecord;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedClient: ClientMasterRecord) => Promise<void>;
  onDelete?: (clientId: string) => Promise<void>;
}

export const EditClientModal: React.FC<EditClientModalProps> = ({
  client,
  isOpen,
  onClose,
  onSave,
  onDelete
}) => {
  const [formData, setFormData] = useState<ClientMasterRecord>({
    ...client,
    primary_products: client.primary_products || ['Mutual Funds']
  });
  const [customProductInput, setCustomProductInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
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
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Celebrated DOB <span className="text-amber-700 font-normal">(Hindu / Indian Calendar)</span>
                </label>
                <input
                  type="date"
                  value={formData.celebrated_dob_custom || ''}
                  onChange={(e) => setFormData({ ...formData, celebrated_dob_custom: e.target.value || undefined })}
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

          {/* Primary Products & Multi-Product Tagging */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-600" /> Primary Products & Subscriptions
              </h4>
              <span className="text-[11px] text-slate-400">Select or type products signed up</span>
            </div>

            {/* Quick Toggle Chips for Standard Products */}
            <div className="flex flex-wrap gap-1.5">
              {STANDARD_PRODUCTS.map(prod => {
                const isSelected = (formData.primary_products || []).includes(prod);
                return (
                  <button
                    key={prod}
                    type="button"
                    onClick={() => {
                      const current = formData.primary_products || [];
                      const updated = isSelected
                        ? current.filter(p => p !== prod)
                        : [...current, prod];
                      setFormData({ ...formData, primary_products: updated });
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <span>{prod}</span>
                    {isSelected && <span className="text-[10px]">✓</span>}
                  </button>
                );
              })}
            </div>

            {/* Custom Product Tag Input */}
            <div className="flex items-center gap-2 pt-1">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Type custom product (e.g. PMS, Fixed Deposit, Bonds) and press Enter..."
                  value={customProductInput}
                  onChange={(e) => setCustomProductInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const tag = customProductInput.trim();
                      if (tag && !(formData.primary_products || []).includes(tag)) {
                        setFormData({
                          ...formData,
                          primary_products: [...(formData.primary_products || []), tag]
                        });
                        setCustomProductInput('');
                      }
                    }
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 font-medium"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  const tag = customProductInput.trim();
                  if (tag && !(formData.primary_products || []).includes(tag)) {
                    setFormData({
                      ...formData,
                      primary_products: [...(formData.primary_products || []), tag]
                    });
                    setCustomProductInput('');
                  }
                }}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Tag</span>
              </button>
            </div>

            {/* Active Tags list */}
            {formData.primary_products && formData.primary_products.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Assigned:</span>
                {formData.primary_products.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          primary_products: (formData.primary_products || []).filter(p => p !== tag)
                        });
                      }}
                      className="text-amber-700 hover:text-amber-900 ml-0.5"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
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
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <div>
              {onDelete && (
                <button
                  type="button"
                  onClick={() => setIsConfirmDeleteOpen(true)}
                  disabled={isDeleting || isSaving}
                  className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1.5 transition-colors border border-rose-200 cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>Delete Client</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || isDeleting}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* DELETE CLIENT CONFIRMATION MODAL */}
      {isConfirmDeleteOpen && (
        <div className="fixed inset-0 z-[80] bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-black text-slate-900">Delete Client Profile?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to permanently delete <strong className="text-slate-900">{client.investor_name}</strong> (PAN: {client.pan || 'Minor/None'}) from the Client Master database?
              </p>
              <p className="text-[11px] text-rose-600 font-semibold mt-1">
                This action cannot be undone. All associated master links will be detached.
              </p>
            </div>
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsConfirmDeleteOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={async () => {
                  if (onDelete) {
                    try {
                      setIsDeleting(true);
                      await onDelete(client.client_id);
                      setIsDeleting(false);
                      setIsConfirmDeleteOpen(false);
                      onClose();
                    } catch (err: any) {
                      setIsDeleting(false);
                      alert('Failed to delete client: ' + err?.message);
                    }
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm cursor-pointer transition-colors"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Client'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
