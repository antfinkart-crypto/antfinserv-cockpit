import React, { useState } from 'react';
import { X, Building2, Save } from 'lucide-react';
import { Lead } from '../types';

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (lead: Lead) => void;
}

export const AddLeadModal: React.FC<AddLeadModalProps> = ({ isOpen, onClose, onSave }) => {
  const [firmName, setFirmName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [mobile, setMobile] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [email, setEmail] = useState('');
  const [industrySector, setIndustrySector] = useState('Building Materials');
  const [nextFollowup, setNextFollowup] = useState(
    new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firmName || !ownerName || !mobile) {
      alert('Please fill in Firm Name, Owner Name, and Mobile');
      return;
    }

    const newLead: Lead = {
      id: 'lead-' + Date.now(),
      entry_date: new Date().toLocaleDateString('en-GB'),
      firm_name: firmName.trim(),
      owner_name: ownerName.trim(),
      mobile: mobile.trim(),
      pan_number: panNumber.trim().toUpperCase(),
      email: email.trim(),
      industry_sector: industrySector,
      next_followup_date: nextFollowup,
      status: 'Warm Lead',
      notes: notes.trim(),
      is_synced: false
    };

    onSave(newLead);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-white text-base">Add B2B MSME Lead</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Company / Firm Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Bansal Plywood Traders"
              value={firmName}
              onChange={e => setFirmName(e.target.value)}
              className="w-full bg-slate-950 text-white p-2 rounded-xl border border-slate-800 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Owner Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Ramesh Bansal"
                value={ownerName}
                onChange={e => setOwnerName(e.target.value)}
                className="w-full bg-slate-950 text-white p-2 rounded-xl border border-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Mobile Number *</label>
              <input
                type="text"
                required
                placeholder="9876543210"
                value={mobile}
                onChange={e => setMobile(e.target.value)}
                className="w-full bg-slate-950 text-white p-2 rounded-xl border border-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">PAN Card</label>
              <input
                type="text"
                placeholder="ABCDE1234F"
                value={panNumber}
                onChange={e => setPanNumber(e.target.value)}
                className="w-full bg-slate-950 text-white p-2 rounded-xl border border-slate-800 focus:outline-none focus:border-blue-500 font-mono uppercase"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Industry Sector</label>
              <select
                value={industrySector}
                onChange={e => setIndustrySector(e.target.value)}
                className="w-full bg-slate-950 text-white p-2 rounded-xl border border-slate-800 focus:outline-none focus:border-blue-500"
              >
                <option value="Plywood">Plywood</option>
                <option value="Hardware">Hardware</option>
                <option value="Cement">Cement</option>
                <option value="Sanitary">Sanitary</option>
                <option value="Iron/Steel">Iron/Steel</option>
                <option value="Building Materials">Building Materials</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Next Follow-up Date</label>
            <input
              type="date"
              value={nextFollowup}
              onChange={e => setNextFollowup(e.target.value)}
              className="w-full bg-slate-950 text-white p-2 rounded-xl border border-slate-800 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Notes / Pitch Hook</label>
            <textarea
              rows={2}
              placeholder="e.g. Discussed Liquid fund treasury parking for trade receivables"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-slate-950 text-white p-2 rounded-xl border border-slate-800 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/30"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Lead</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
