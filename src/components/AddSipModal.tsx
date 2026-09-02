import React, { useState } from 'react';
import { X, TrendingUp, Save } from 'lucide-react';
import { SipPortfolio } from '../types';

interface AddSipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (sip: SipPortfolio) => void;
}

export const AddSipModal: React.FC<AddSipModalProps> = ({ isOpen, onClose, onSave }) => {
  const [investorName, setInvestorName] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [mobile, setMobile] = useState('');
  const [schemeName, setSchemeName] = useState('');
  const [amcName, setAmcName] = useState('Kotak Mutual Fund');
  const [folioNumber, setFolioNumber] = useState('');
  const [sipDueDay, setSipDueDay] = useState<number>(10);
  const [monthlyAmt, setMonthlyAmt] = useState<number>(5000);
  const [currentAum, setCurrentAum] = useState<number>(50000);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!investorName || !schemeName) {
      alert('Please fill in Investor Name and Scheme Name');
      return;
    }

    const newSip: SipPortfolio = {
      id: 'sip-' + Date.now(),
      investor_name: investorName.trim().toUpperCase(),
      client_pan: panNumber.trim().toUpperCase() || 'NO_PAN',
      pan_number: panNumber.trim().toUpperCase() || 'NO_PAN',
      mobile: mobile.trim(),
      scheme_name: schemeName.trim(),
      amc_name: amcName.trim(),
      folio_number: folioNumber.trim(),
      sip_due_day: Number(sipDueDay),
      sip_date: Number(sipDueDay),
      monthly_amt: Number(monthlyAmt),
      monthly_amount: Number(monthlyAmt),
      sip_amount: Number(monthlyAmt),
      current_aum: Number(currentAum),
      frequency: 'Monthly',
      status: 'Active',
      holding_match_status: 'Pending / Not Found',
      created_at: new Date().toISOString()
    };

    onSave(newSip);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-base">Add Mutual Fund SIP</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Investor Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. ANKIT ATTRI"
              value={investorName}
              onChange={e => setInvestorName(e.target.value)}
              className="w-full bg-slate-950 text-white p-2 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 uppercase"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">PAN Number</label>
              <input
                type="text"
                placeholder="BMYPA8012M"
                value={panNumber}
                onChange={e => setPanNumber(e.target.value)}
                className="w-full bg-slate-950 text-white p-2 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 font-mono uppercase"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Mobile Number</label>
              <input
                type="text"
                placeholder="9780512498"
                value={mobile}
                onChange={e => setMobile(e.target.value)}
                className="w-full bg-slate-950 text-white p-2 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Scheme Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Bandhan Small Cap Fund - Regular Growth"
              value={schemeName}
              onChange={e => setSchemeName(e.target.value)}
              className="w-full bg-slate-950 text-white p-2 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Folio Number</label>
              <input
                type="text"
                placeholder="e.g. 4689137/14"
                value={folioNumber}
                onChange={e => setFolioNumber(e.target.value)}
                className="w-full bg-slate-950 text-white p-2 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">SIP Debit Day (1–31) *</label>
              <input
                type="number"
                min={1}
                max={31}
                required
                value={sipDueDay}
                onChange={e => setSipDueDay(Number(e.target.value))}
                className="w-full bg-slate-950 text-white p-2 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Monthly SIP (₹) *</label>
              <input
                type="number"
                required
                value={monthlyAmt}
                onChange={e => setMonthlyAmt(Number(e.target.value))}
                className="w-full bg-slate-950 text-emerald-400 font-bold p-2 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Current AUM (₹)</label>
              <input
                type="number"
                value={currentAum}
                onChange={e => setCurrentAum(Number(e.target.value))}
                className="w-full bg-slate-950 text-white font-bold p-2 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500"
              />
            </div>
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
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/30"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save SIP Mandate</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
