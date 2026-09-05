import React, { useState } from 'react';
import { X, Save, TrendingUp, AlertCircle } from 'lucide-react';
import { MfHolding } from '../types';

interface EditHoldingModalProps {
  isOpen: boolean;
  holding: MfHolding | null;
  onClose: () => void;
  onSave: (updated: MfHolding) => Promise<void>;
}

export const EditHoldingModal: React.FC<EditHoldingModalProps> = ({
  isOpen,
  holding,
  onClose,
  onSave
}) => {
  if (!isOpen || !holding) return null;

  const [investorName, setInvestorName] = useState(holding.investor_name || '');
  const [pan, setPan] = useState(holding.pan || '');
  const [schemeName, setSchemeName] = useState(holding.scheme_name || '');
  const [amcName, setAmcName] = useState(holding.amc_name || '');
  const [categoryName, setCategoryName] = useState(holding.category_name || '');
  const [folioNumber, setFolioNumber] = useState(holding.folio_number || '');
  const [holdingUnits, setHoldingUnits] = useState<number | ''>(holding.holding_units ?? '');
  const [latestNav, setLatestNav] = useState<number | ''>(holding.latest_nav ?? '');
  const [investedCost, setInvestedCost] = useState<number | ''>(holding.invested_cost ?? '');
  const [currentValue, setCurrentValue] = useState<number | ''>(holding.current_value ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [autoCalc, setAutoCalc] = useState(true);

  // Recalculate current value if units or nav changes and autoCalc is true
  const handleUnitsChange = (val: number | '') => {
    setHoldingUnits(val);
    if (autoCalc && typeof val === 'number' && typeof latestNav === 'number') {
      setCurrentValue(Math.round(val * latestNav * 100) / 100);
    }
  };

  const handleNavChange = (val: number | '') => {
    setLatestNav(val);
    if (autoCalc && typeof val === 'number' && typeof holdingUnits === 'number') {
      setCurrentValue(Math.round(val * holdingUnits * 100) / 100);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schemeName || !folioNumber) {
      alert('Scheme name and Folio number are mandatory.');
      return;
    }

    try {
      setIsSaving(true);
      const updated: MfHolding = {
        ...holding,
        investor_name: investorName.trim(),
        pan: pan.trim().toUpperCase(),
        scheme_name: schemeName.trim(),
        amc_name: amcName.trim() || 'Other AMC',
        category_name: categoryName.trim() || undefined,
        folio_number: folioNumber.trim(),
        holding_units: typeof holdingUnits === 'number' ? holdingUnits : 0,
        latest_nav: typeof latestNav === 'number' ? latestNav : 0,
        invested_cost: typeof investedCost === 'number' ? investedCost : 0,
        current_value: typeof currentValue === 'number' ? currentValue : 0
      };

      await onSave(updated);
      setIsSaving(false);
      onClose();
    } catch (err: any) {
      setIsSaving(false);
      alert('Error saving holding: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg">Edit Mutual Fund Holding</h3>
              <p className="text-xs text-slate-500 font-mono">Folio: {holding.folio_number} | ID: {holding.id}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Investor Name
              </label>
              <input
                type="text"
                value={investorName}
                onChange={e => setInvestorName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-none focus:border-amber-500"
                placeholder="e.g. Swaminathan Arunachalam"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                PAN Number
              </label>
              <input
                type="text"
                value={pan}
                onChange={e => setPan(e.target.value.toUpperCase())}
                maxLength={10}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500 uppercase"
                placeholder="e.g. ADLPA7633H"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Scheme Name
              </label>
              <input
                type="text"
                value={schemeName}
                onChange={e => setSchemeName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-none focus:border-amber-500"
                placeholder="e.g. HDFC Top 100 Fund - Growth"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Fund House / AMC
              </label>
              <input
                type="text"
                value={amcName}
                onChange={e => setAmcName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-amber-500"
                placeholder="e.g. HDFC Mutual Fund"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Category
              </label>
              <input
                type="text"
                value={categoryName}
                onChange={e => setCategoryName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-amber-500"
                placeholder="e.g. Large Cap / Equity"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Folio Number
              </label>
              <input
                type="text"
                value={folioNumber}
                onChange={e => setFolioNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                placeholder="e.g. 12345678/90"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Holding Units
              </label>
              <input
                type="number"
                step="any"
                value={holdingUnits}
                onChange={e => handleUnitsChange(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono text-slate-900 focus:outline-none focus:border-amber-500"
                placeholder="0.000"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Latest NAV (₹)
              </label>
              <input
                type="number"
                step="any"
                value={latestNav}
                onChange={e => handleNavChange(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono text-slate-900 focus:outline-none focus:border-amber-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Invested Cost (₹)
              </label>
              <input
                type="number"
                step="any"
                value={investedCost}
                onChange={e => setInvestedCost(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold text-slate-700 focus:outline-none focus:border-amber-500"
                placeholder="₹ Invested"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-amber-800 uppercase tracking-wider">
                  Current Valuation / AUM (₹)
                </label>
                <label className="text-[11px] flex items-center gap-1 cursor-pointer text-slate-500">
                  <input
                    type="checkbox"
                    checked={autoCalc}
                    onChange={e => setAutoCalc(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-0"
                  />
                  Auto-calc (Units × NAV)
                </label>
              </div>
              <input
                type="number"
                step="any"
                value={currentValue}
                onChange={e => {
                  setAutoCalc(false);
                  setCurrentValue(e.target.value === '' ? '' : parseFloat(e.target.value));
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 bg-amber-50/40 text-sm font-mono font-extrabold text-slate-900 focus:outline-none focus:border-amber-600"
                placeholder="₹ Current AUM"
                required
              />
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2 text-xs text-blue-900">
            <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p>
              Saving this holding will automatically update this investor's consolidated AUM in <strong>Client Master</strong> and Cockpit metrics in real time.
            </p>
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Holding'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
