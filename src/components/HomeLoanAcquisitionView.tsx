import React, { useState } from 'react';
import { Home, Phone, Building, CheckCircle2, AlertTriangle, Calculator, Sparkles } from 'lucide-react';
import { calculateHomeLoanBT, HomeLoanInputs } from '../lib/homeLoanEngine';
import { WiseAntCard } from './WiseAntCard';
import { generateWhatsAppUrl } from '../lib/whatsAppRouter';

export const HomeLoanAcquisitionView: React.FC = () => {
  const [inputs, setInputs] = useState<HomeLoanInputs>({
    clientName: 'Rajesh Gupta',
    mobile: '9779072022',
    currentLender: 'HDFC Bank',
    outstandingPrincipal: 2500000,
    currentRate: 9.0,
    remainingTenureMonths: 180,
    currentEmi: 25370,
    proposedRate: 8.25,
    transferCosts: 25000
  });

  const [discovery, setDiscovery] = useState({
    city: 'Ludhiana',
    occupation: 'Business Owner / Professional',
    vehicleFinanced: 'Yes',
    mfRelationship: 'Existing Investor',
    businessFunding: 'Working Capital OD (₹50L)',
    insuranceReviewDue: 'Yes (Health Floater)',
    notes: 'Consultative meeting. Appreciated transparent no-pressure calculation.'
  });

  const results = calculateHomeLoanBT(inputs);

  const handleShareSummary = () => {
    const msg = `Dear ${inputs.clientName},

Here is the ANTFINSERV Balance Transfer Savings Check for your Home Loan (${inputs.currentLender}):

• Outstanding Balance: ₹${inputs.outstandingPrincipal.toLocaleString('en-IN')}
• Current Rate & EMI: ${inputs.currentRate}% (₹${inputs.currentEmi.toLocaleString('en-IN')}/mo)
• Proposed Rate & EMI: ${inputs.proposedRate}% (₹${results.newEmi.toLocaleString('en-IN')}/mo)
• Monthly EMI Reduction: ₹${results.monthlyEmiReduction.toLocaleString('en-IN')}
• Net Saving (After ₹${inputs.transferCosts.toLocaleString('en-IN')} Costs): ₹${results.netSaving.toLocaleString('en-IN')}
• Break-Even Period: ${results.breakEvenMonths} Months

OUR CONCLUSION:
${results.conclusionText}

THE WISE ANT SAYS:
"${results.wiseAntMessage}"

Warm Regards,
AntFinserv.com (ARN-94204)
Planning your Finances, like the Wise Ant`;

    const url = generateWhatsAppUrl(inputs.mobile, msg);
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Home className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                Home Loan Balance Transfer Savings Check
                <span className="text-[10px] md:text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-200">
                  Acquisition Engine v2
                </span>
              </h2>
              <p className="text-xs md:text-sm text-slate-500 mt-0.5">
                Transparent economic comparison before asking for client documents. Fiduciary no-pressure analysis.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleShareSummary}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs md:text-sm flex items-center gap-2 shadow-sm transition-all"
        >
          <Phone className="w-4 h-4" />
          <span>Share Summary on WhatsApp</span>
        </button>
      </div>

      {/* Grid: Inputs + Decision Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Inputs */}
        <div className="lg:col-span-6 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
            <h3 className="font-bold text-sm md:text-base text-slate-900 flex items-center gap-2 uppercase tracking-wider">
              <Calculator className="w-4 h-4 text-amber-600" />
              <span>Loan Parameters</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-600 font-semibold mb-1 text-xs md:text-sm">Client Name</label>
                <input
                  type="text"
                  value={inputs.clientName}
                  onChange={e => setInputs({ ...inputs, clientName: e.target.value })}
                  className="w-full bg-white text-slate-900 p-2.5 md:p-3 text-xs md:text-sm rounded-xl border border-slate-300 font-semibold focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1 text-xs md:text-sm">Client Mobile</label>
                <input
                  type="tel"
                  value={inputs.mobile}
                  onChange={e => setInputs({ ...inputs, mobile: e.target.value })}
                  className="w-full bg-white text-slate-900 p-2.5 md:p-3 text-xs md:text-sm rounded-xl border border-slate-300 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-600 font-semibold mb-1 text-xs md:text-sm">Current Lender</label>
                <input
                  type="text"
                  value={inputs.currentLender}
                  onChange={e => setInputs({ ...inputs, currentLender: e.target.value })}
                  className="w-full bg-white text-slate-900 p-2.5 md:p-3 text-xs md:text-sm rounded-xl border border-slate-300 font-semibold focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1 text-xs md:text-sm">Outstanding Principal (₹)</label>
                <input
                  type="number"
                  step="50000"
                  value={inputs.outstandingPrincipal}
                  onChange={e => setInputs({ ...inputs, outstandingPrincipal: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-white text-amber-700 font-black p-2.5 md:p-3 text-xs md:text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-600 font-semibold mb-1 text-xs md:text-sm">Current Rate (%)</label>
                <input
                  type="number"
                  step="0.05"
                  value={inputs.currentRate}
                  onChange={e => setInputs({ ...inputs, currentRate: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-white text-slate-900 font-bold p-2.5 md:p-3 text-xs md:text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1 text-xs md:text-sm">Tenure (Mos)</label>
                <input
                  type="number"
                  value={inputs.remainingTenureMonths}
                  onChange={e => setInputs({ ...inputs, remainingTenureMonths: parseInt(e.target.value) || 0 })}
                  className="w-full bg-white text-slate-900 font-bold p-2.5 md:p-3 text-xs md:text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1 text-xs md:text-sm">Current EMI (₹)</label>
                <input
                  type="number"
                  value={inputs.currentEmi}
                  onChange={e => setInputs({ ...inputs, currentEmi: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-white text-slate-900 font-bold p-2.5 md:p-3 text-xs md:text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-emerald-800 font-bold mb-1 text-xs md:text-sm">Proposed Rate (%)</label>
                <input
                  type="number"
                  step="0.05"
                  value={inputs.proposedRate}
                  onChange={e => setInputs({ ...inputs, proposedRate: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-emerald-50/50 text-emerald-800 font-black p-2.5 md:p-3 text-xs md:text-sm rounded-xl border border-emerald-300 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1 text-xs md:text-sm">Transfer Costs (₹)</label>
                <input
                  type="number"
                  step="1000"
                  value={inputs.transferCosts}
                  onChange={e => setInputs({ ...inputs, transferCosts: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-white text-slate-900 font-bold p-2.5 md:p-3 text-xs md:text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Decision Panel */}
        <div className="lg:col-span-6 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-200 space-y-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">AntFinserv Decision Matrix</span>
              <span className={`text-xs md:text-sm font-black px-3.5 py-1.5 rounded-full border ${
                results.decision === 'RECOMMEND_TRANSFER'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : results.decision === 'BORDERLINE'
                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                  : 'bg-rose-50 text-rose-800 border-rose-300'
              }`}>
                {results.decisionBadge}
              </span>
            </div>

            {/* Results Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-500">New EMI</span>
                <p className="text-base md:text-xl font-black text-emerald-700 mt-1">₹{results.newEmi.toLocaleString('en-IN')}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-500">EMI Reduction</span>
                <p className="text-base md:text-xl font-black text-slate-900 mt-1">₹{results.monthlyEmiReduction.toLocaleString('en-IN')}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-500">Net Saving</span>
                <p className={`text-base md:text-xl font-black mt-1 ${results.netSaving > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  ₹{results.netSaving.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-500">Break-Even</span>
                <p className="text-base md:text-xl font-black text-amber-700 mt-1">{results.breakEvenMonths} Mos</p>
              </div>
            </div>

            {/* Conclusion Box */}
            <div className="p-4 md:p-5 rounded-xl bg-slate-50 border border-slate-200 text-xs md:text-sm text-slate-700 leading-relaxed space-y-1">
              <span className="font-bold text-slate-900">Analysis Summary: </span>
              {results.conclusionText}
            </div>

            <WiseAntCard
              mood={results.decision === 'RECOMMEND_TRANSFER' ? 'Opportunity' : 'Trust'}
              message={results.wiseAntMessage}
              subtext="Fiduciary Consultation • AntFinserv"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
