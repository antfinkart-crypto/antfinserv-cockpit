import React, { useState } from 'react';
import {
  Home,
  Phone,
  Building,
  CheckCircle2,
  AlertTriangle,
  Calculator,
  Sparkles,
  Zap,
  TrendingDown,
  Clock,
  ArrowRight,
  HelpCircle,
  Edit2,
  FileText,
  Printer,
  TrendingUp
} from 'lucide-react';
import {
  calculateHomeLoanBT,
  calculateTenureFromEmi,
  HomeLoanInputs,
  HomeLoanResults
} from '../lib/homeLoanEngine';
import { WiseAntCard } from './WiseAntCard';
import { HomeLoanVerdictReportModal } from './HomeLoanVerdictReportModal';
import { generateWhatsAppUrl } from '../lib/whatsAppRouter';

export const HomeLoanAcquisitionView: React.FC = () => {
  const [inputs, setInputs] = useState<HomeLoanInputs>({
    clientName: 'Bharti Madan',
    mobile: '7814251234',
    currentLender: 'Bank of India',
    outstandingPrincipal: 2055485,
    currentRate: 8.1,
    currentEmi: 27774,
    proposedRate: 7.35,
    transferCosts: 25000,
    tenureMode: 'AUTO',
    manualTenureMonths: 103,
    strategy: 'LOWER_EMI',
    customTenureMonths: 180
  });

  const [isManualTenure, setIsManualTenure] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Auto-calculate tenure from Principal, Rate, and EMI
  const autoTenure = calculateTenureFromEmi(
    inputs.outstandingPrincipal,
    inputs.currentRate,
    inputs.currentEmi
  );

  // Calculate full results
  const results: HomeLoanResults = calculateHomeLoanBT({
    ...inputs,
    tenureMode: isManualTenure ? 'MANUAL' : 'AUTO'
  });

  // Calculate Wealth Multiplier (SIP compounding at 12% CAGR)
  const monthlySaving = results.monthlyEmiReduction > 0 ? results.monthlyEmiReduction : 0;
  const tenureMonths = results.activeRemainingTenure;
  const i = 0.12 / 12;
  const sipFutureValue = monthlySaving > 0
    ? Math.round(monthlySaving * ((Math.pow(1 + i, tenureMonths) - 1) / i) * (1 + i))
    : 0;
  const totalSipInvested = monthlySaving * tenureMonths;

  const handleShareSummary = () => {
    let strategyDesc = '';
    if (inputs.strategy === 'FASTER_PAYOFF') {
      strategyDesc = `• Strategy: FASTER DEBT FREEDOM (Maintain current ₹${inputs.currentEmi.toLocaleString('en-IN')} EMI)
• Loan Paid Off: ${results.monthsSaved} Months Earlier (${(results.monthsSaved / 12).toFixed(1)} Years Sooner!)
• New Tenure: ${results.newTenureMonths} Months (vs ${results.activeRemainingTenure} Mos currently)
• Net Interest Saved: ₹${Math.round(results.netSaving).toLocaleString('en-IN')} (After recovering ₹${inputs.transferCosts.toLocaleString('en-IN')} transfer costs)`;
    } else if (inputs.strategy === 'LOWER_EMI') {
      strategyDesc = `• Strategy: REDUCE MONTHLY EMI (Keep same ${results.activeRemainingTenure} Months tenure)
• New Reduced EMI: ₹${results.newEmi.toLocaleString('en-IN')}/mo (Drop of ₹${results.monthlyEmiReduction.toLocaleString('en-IN')}/mo)
• Net Lifetime Savings: ₹${Math.round(results.netSaving).toLocaleString('en-IN')} (After recovering ₹${inputs.transferCosts.toLocaleString('en-IN')} transfer costs)
• Break-Even Period: ${results.breakEvenMonths} Months`;
    } else {
      strategyDesc = `• Strategy: CASH FLOW RELIEF (${results.newTenureMonths} Months tenure)
• New Reduced EMI: ₹${results.newEmi.toLocaleString('en-IN')}/mo (Outflow reduction: ₹${results.monthlyEmiReduction.toLocaleString('en-IN')}/mo)
• Net Economic Impact: ₹${Math.round(results.netSaving).toLocaleString('en-IN')}`;
    }

    const msg = `Dear ${inputs.clientName},

Here is your Official ANTFINSERV Balance Transfer & Refinancing Audit (${inputs.currentLender}):

VERIFIED CURRENT LOAN:
• Outstanding Principal: ₹${inputs.outstandingPrincipal.toLocaleString('en-IN')}
• Current Interest Rate: ${inputs.currentRate}%
• Current Monthly EMI: ₹${inputs.currentEmi.toLocaleString('en-IN')}/mo
• Verified Remaining Tenure: ${results.activeRemainingTenure} Months (${Math.floor(results.activeRemainingTenure / 12)} Yrs ${results.activeRemainingTenure % 12} Mos)

REFINANCING PROPOSAL (@ ${inputs.proposedRate}%):
${strategyDesc}

EXPERT ADVISORY VERDICT:
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
      <div className="glass-panel p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs bg-white">
        <div>
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-700 border border-amber-500/20 flex items-center justify-center font-black text-xl shadow-xs">
              <Home className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl md:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
                  Home Loan Refinancing & Acquisition Engine
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-200 hidden sm:inline-block">
                  v3 Institutional Precision
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-500 mt-0.5">
                Bank-grade precision engine. Auto-determines true outstanding tenure from debited EMI & loan balance. 100% transparent client advice.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs md:text-sm flex items-center gap-2 shadow-xs transition-all border border-slate-700"
          >
            <FileText className="w-4 h-4 text-amber-400" />
            <span>Generate Verdict Report</span>
          </button>

          <button
            onClick={handleShareSummary}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs md:text-sm flex items-center gap-2 shadow-xs transition-all flex-shrink-0"
          >
            <Phone className="w-4 h-4" />
            <span>Share on WhatsApp</span>
          </button>
        </div>
      </div>

      {/* Grid: Inputs + Decision Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Inputs & Strategy Picker */}
        <div className="lg:col-span-6 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-200 space-y-5 shadow-xs bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-sm md:text-base text-slate-900 flex items-center gap-2 uppercase tracking-wider">
                <Calculator className="w-4 h-4 text-amber-600" />
                <span>Verified Loan Parameters</span>
              </h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">From Account Statement</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Client Name</label>
                <input
                  type="text"
                  value={inputs.clientName}
                  onChange={(e) => setInputs({ ...inputs, clientName: e.target.value })}
                  className="w-full px-3 py-2 text-xs md:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Client Mobile</label>
                <input
                  type="text"
                  value={inputs.mobile}
                  onChange={(e) => setInputs({ ...inputs, mobile: e.target.value })}
                  className="w-full px-3 py-2 text-xs md:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Current Lender</label>
                <input
                  type="text"
                  value={inputs.currentLender}
                  onChange={(e) => setInputs({ ...inputs, currentLender: e.target.value })}
                  className="w-full px-3 py-2 text-xs md:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Outstanding Principal (₹) <span className="text-amber-600">*</span>
                </label>
                <input
                  type="number"
                  value={inputs.outstandingPrincipal}
                  onChange={(e) => setInputs({ ...inputs, outstandingPrincipal: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-xs md:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 font-mono font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Current Interest Rate (%) <span className="text-amber-600">*</span>
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={inputs.currentRate}
                  onChange={(e) => setInputs({ ...inputs, currentRate: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-xs md:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 font-mono font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Current Debited Monthly EMI (₹) <span className="text-amber-600">*</span>
                </label>
                <input
                  type="number"
                  value={inputs.currentEmi}
                  onChange={(e) => setInputs({ ...inputs, currentEmi: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-xs md:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 font-mono font-bold text-slate-900"
                />
              </div>
            </div>

            {/* Auto-Calculated Tenure Display Box */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-bold text-slate-900">
                    Calculated Remaining Tenure:
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsManualTenure(!isManualTenure)}
                  className="text-[11px] font-bold text-amber-800 hover:text-amber-900 underline flex items-center gap-1"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>{isManualTenure ? 'Switch to Auto-Calculate' : 'Manual Override'}</span>
                </button>
              </div>

              {!isManualTenure ? (
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-black text-slate-900 font-mono">
                      {autoTenure.months} Months
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      ({autoTenure.years} Years {autoTenure.remMonths} Months remaining)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    Auto-computed accurately from your ₹{inputs.outstandingPrincipal.toLocaleString('en-IN')} balance, {inputs.currentRate}% rate, and ₹{inputs.currentEmi.toLocaleString('en-IN')} EMI. (Eliminates errors caused by historic rate revisions).
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5 pt-1">
                  <label className="block text-[11px] font-bold text-slate-700">Enter Known Remaining Tenure (Months):</label>
                  <input
                    type="number"
                    value={inputs.manualTenureMonths}
                    onChange={(e) => setInputs({ ...inputs, manualTenureMonths: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-amber-300 font-mono font-bold bg-white"
                  />
                  <span className="text-[10px] text-slate-500">Auto-calculated value was: {autoTenure.months} months</span>
                </div>
              )}
            </div>

            {/* Proposed Refinancing Terms */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-semibold text-emerald-800 mb-1">
                  Proposed New Rate (%)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={inputs.proposedRate}
                  onChange={(e) => setInputs({ ...inputs, proposedRate: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-xs md:text-sm rounded-xl border border-emerald-300 bg-emerald-50/40 focus:outline-none focus:border-emerald-600 font-mono font-bold text-emerald-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Transfer Costs (MODT, Legal, Admin) (₹)
                </label>
                <input
                  type="number"
                  value={inputs.transferCosts}
                  onChange={(e) => setInputs({ ...inputs, transferCosts: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-xs md:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>

            {/* Strategic Pathway Selector */}
            <div className="space-y-2 pt-3 border-t border-slate-100">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Choose Refinancing Strategy:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setInputs({ ...inputs, strategy: 'LOWER_EMI' })}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    inputs.strategy === 'LOWER_EMI'
                      ? 'border-amber-500 bg-amber-50/50 shadow-xs ring-2 ring-amber-500/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                      <TrendingDown className="w-3.5 h-3.5 text-amber-600" />
                      <span>Reduce Monthly EMI</span>
                    </span>
                    {inputs.strategy === 'LOWER_EMI' && <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Keep same {results.activeRemainingTenure} Mos tenure. Drops EMI by ₹{results.pathA_LowerEmi.monthlyEmiReduction.toLocaleString('en-IN')}/mo.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setInputs({ ...inputs, strategy: 'FASTER_PAYOFF' })}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    inputs.strategy === 'FASTER_PAYOFF'
                      ? 'border-emerald-500 bg-emerald-50/50 shadow-xs ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Faster Debt Freedom</span>
                    </span>
                    {inputs.strategy === 'FASTER_PAYOFF' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Pay same ₹{inputs.currentEmi.toLocaleString('en-IN')} EMI. Finish loan {results.pathB_FasterPayoff.monthsSaved} months sooner!
                  </p>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Decision Matrix & Accurate Results */}
        <div className="lg:col-span-6 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-200 space-y-5 shadow-xs bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-sm md:text-base text-slate-900 uppercase tracking-wider">
                ANTFINSERV Decision Matrix
              </h3>
              <span
                className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                  results.isBeneficial
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    : 'bg-amber-100 text-amber-900 border-amber-300'
                }`}
              >
                {results.decisionBadge}
              </span>
            </div>

            {/* Metrics Dashboard */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">New EMI</span>
                <p className="text-lg font-black text-slate-900 font-mono mt-0.5">
                  ₹{results.newEmi.toLocaleString('en-IN')}
                </p>
                <span className="text-[10px] text-slate-500">per month</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  {inputs.strategy === 'FASTER_PAYOFF' ? 'Time Saved' : 'EMI Reduction'}
                </span>
                <p className="text-lg font-black text-emerald-700 font-mono mt-0.5">
                  {inputs.strategy === 'FASTER_PAYOFF'
                    ? `${results.monthsSaved} Mos`
                    : `₹${results.monthlyEmiReduction.toLocaleString('en-IN')}`}
                </p>
                <span className="text-[10px] text-slate-500">
                  {inputs.strategy === 'FASTER_PAYOFF' ? 'sooner debt-free' : 'monthly relief'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                <span className="text-[10px] uppercase font-bold text-emerald-800 block">Net Saving</span>
                <p className="text-lg font-black text-emerald-900 font-mono mt-0.5">
                  ₹{Math.round(results.netSaving).toLocaleString('en-IN')}
                </p>
                <span className="text-[10px] text-emerald-700">after ₹{inputs.transferCosts.toLocaleString('en-IN')} costs</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Break-Even</span>
                <p className="text-lg font-black text-slate-900 font-mono mt-0.5">
                  {inputs.strategy === 'FASTER_PAYOFF' ? 'Immediate' : `${results.breakEvenMonths} Mos`}
                </p>
                <span className="text-[10px] text-slate-500">
                  {inputs.strategy === 'FASTER_PAYOFF' ? 'amortization' : 'cost recovery'}
                </span>
              </div>
            </div>

            {/* Analysis Summary */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <span className="font-bold text-slate-900 block">AntFinServ Advisory Verdict:</span>
              <p className="text-slate-600 leading-relaxed">{results.conclusionText}</p>
            </div>

            {/* Button to Launch Full Sanction Report */}
            <button
              type="button"
              onClick={() => setIsReportModalOpen(true)}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 text-white font-bold text-xs md:text-sm flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg transition-all border border-amber-500/30 group cursor-pointer"
            >
              <FileText className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              <span>Generate Official Verdict Report (PDF)</span>
              <ArrowRight className="w-4 h-4 text-amber-400" />
            </button>

            {/* Compounding Wealth Multiplier Callout */}
            {monthlySaving > 0 && (
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <TrendingUp className="w-5 h-5 text-amber-700" />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-black text-slate-900 block">
                    The Wealth Multiplier Advantage:
                  </span>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    If you channel your monthly savings of <strong>₹{monthlySaving.toLocaleString('en-IN')}/mo</strong> into an automated <strong>Mutual Fund Wealth SIP (12% CAGR)</strong> for {tenureMonths} months, your saved money creates an additional <strong>₹{sipFutureValue.toLocaleString('en-IN')}</strong> wealth corpus!
                  </p>
                </div>
              </div>
            )}

            {/* Wise Ant Commentary Card */}
            <WiseAntCard
              message={results.wiseAntMessage}
              subtext="Expert Advisory • AntFinserv (ARN-94204)"
              mood={results.isBeneficial ? 'Opportunity' : 'Cautious'}
            />

            {/* Amortization Breakdown Table */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Amortization Comparison (Current vs Proposed)
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase">
                      <th className="py-2">Metric</th>
                      <th className="py-2 text-right">Current Loan</th>
                      <th className="py-2 text-right">Proposed Loan</th>
                      <th className="py-2 text-right text-emerald-700">Difference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    <tr>
                      <td className="py-2 text-slate-700 font-sans">Interest Rate</td>
                      <td className="py-2 text-right text-slate-900">{inputs.currentRate}%</td>
                      <td className="py-2 text-right text-emerald-700">{inputs.proposedRate}%</td>
                      <td className="py-2 text-right text-emerald-700 font-bold">
                        -{(inputs.currentRate - inputs.proposedRate).toFixed(2)}%
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 text-slate-700 font-sans">Monthly EMI</td>
                      <td className="py-2 text-right text-slate-900">₹{inputs.currentEmi.toLocaleString('en-IN')}</td>
                      <td className="py-2 text-right text-slate-900">₹{results.newEmi.toLocaleString('en-IN')}</td>
                      <td className="py-2 text-right text-emerald-700 font-bold">
                        {results.monthlyEmiReduction > 0 ? `-₹${results.monthlyEmiReduction.toLocaleString('en-IN')}` : 'Same EMI'}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 text-slate-700 font-sans">Tenure</td>
                      <td className="py-2 text-right text-slate-900">{results.activeRemainingTenure} Mos</td>
                      <td className="py-2 text-right text-slate-900">{results.newTenureMonths} Mos</td>
                      <td className="py-2 text-right text-emerald-700 font-bold">
                        {results.monthsSaved > 0 ? `-${results.monthsSaved} Mos Earlier` : 'Same Tenure'}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 text-slate-700 font-sans">Total Lifetime Outgo</td>
                      <td className="py-2 text-right text-slate-900">
                        ₹{results.currentTotalPayment.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2 text-right text-slate-900">
                        ₹{results.newTotalPayment.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2 text-right text-emerald-700 font-bold">
                        -₹{Math.round(results.grossInterestSaving).toLocaleString('en-IN')}
                      </td>
                    </tr>
                    <tr className="bg-emerald-50/50 font-bold">
                      <td className="py-2 text-emerald-900 font-sans">Net Savings (After Costs)</td>
                      <td className="py-2 text-right text-slate-400">—</td>
                      <td className="py-2 text-right text-slate-400">—</td>
                      <td className="py-2 text-right text-emerald-800">
                        ₹{Math.round(results.netSaving).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Official Verdict Report Modal */}
      <HomeLoanVerdictReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        inputs={inputs}
        results={results}
      />
    </div>
  );
};
