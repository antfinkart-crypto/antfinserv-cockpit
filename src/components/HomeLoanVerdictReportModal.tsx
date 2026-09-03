import React from 'react';
import { X, Printer, Phone, Download, CheckCircle2, Shield, TrendingUp, Calendar, ArrowRight, Award } from 'lucide-react';
import { HomeLoanInputs, HomeLoanResults } from '../lib/homeLoanEngine';
import { generateWhatsAppUrl } from '../lib/whatsAppRouter';

interface HomeLoanVerdictReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  inputs: HomeLoanInputs;
  results: HomeLoanResults;
}

export const HomeLoanVerdictReportModal: React.FC<HomeLoanVerdictReportModalProps> = ({
  isOpen,
  onClose,
  inputs,
  results
}) => {
  if (!isOpen) return null;

  const refNumber = `AFS/HL-${Date.now().toString().slice(-6)}`;
  const todayDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  // Calculate SIP Wealth Multiplier (12% CAGR over active tenure)
  const monthlySaving = results.monthlyEmiReduction > 0 ? results.monthlyEmiReduction : 1000;
  const n = results.activeRemainingTenure;
  const i = 0.12 / 12;
  const sipFutureValue = Math.round(monthlySaving * ((Math.pow(1 + i, n) - 1) / i) * (1 + i));
  const totalSipInvested = monthlySaving * n;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsApp = () => {
    const msg = `Dear ${inputs.clientName},
    
Please find your Official AntFinServ Home Loan Balance Transfer & Refinancing Audit (Ref: ${refNumber}).

• Outstanding Principal: ₹${inputs.outstandingPrincipal.toLocaleString('en-IN')}
• Current Rate & EMI: ${inputs.currentRate}% (₹${inputs.currentEmi.toLocaleString('en-IN')}/mo)
• Proposed Rate & EMI: ${inputs.proposedRate}% (₹${results.newEmi.toLocaleString('en-IN')}/mo)
• Verified Remaining Tenure: ${results.activeRemainingTenure} Months
• Net Financial Savings: ₹${Math.round(results.netSaving).toLocaleString('en-IN')}
• Cost Recovery Horizon: ${results.breakEvenMonths} Months

View full advisory analysis and next steps with AntFinServ.com (ARN-94204).`;
    const url = generateWhatsAppUrl(inputs.mobile, msg);
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 print:p-0 print:bg-white">
      <div className="bg-white text-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto print:border-none print:shadow-none print:rounded-none print:max-w-none print:w-full">
        
        {/* Modal Top Action Bar (Hidden on Print) */}
        <div className="p-4 sm:px-6 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Official Client Advisory Report
            </span>
            <span className="text-xs font-mono text-slate-400">Ref: {refNumber}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={handleWhatsApp}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Phone className="w-4 h-4" />
              <span>Share WhatsApp</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Container */}
        <div id="printable-verdict-report" className="p-6 sm:p-10 space-y-6 print:p-6">
          
          {/* Executive Header Banner */}
          <div className="rounded-2xl overflow-hidden border border-amber-500/20 shadow-sm bg-slate-950 text-white">
            <div className="p-6 sm:p-7 flex flex-col sm:flex-row items-center justify-between gap-6 bg-gradient-to-r from-slate-950 via-[#0d1b3e] to-slate-950">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-amber-400/40 shadow-lg flex-shrink-0 bg-slate-900">
                  <img src="/logo.png" alt="AntFinServ" className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                      AntFinServ<span className="text-amber-400">.com</span>
                    </h1>
                    <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/40">
                      AMFI REGD. MFD ARN-94204
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 font-medium mt-0.5 tracking-wide">
                    PLANNING YOUR FINANCES. BUILDING YOUR WEALTH.
                  </p>
                  <p className="text-[11px] text-amber-400/80 font-mono mt-1">
                    INSIGHTS • WEALTH • GROWTH
                  </p>
                </div>
              </div>

              <div className="text-right sm:border-l sm:border-slate-800 sm:pl-6 w-full sm:w-auto flex flex-row sm:flex-col justify-between sm:justify-center">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Document Ref</span>
                  <span className="text-xs font-mono font-bold text-amber-400">{refNumber}</span>
                </div>
                <div className="mt-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Audit Date</span>
                  <span className="text-xs text-slate-200">{todayDate}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Title Header */}
          <div className="border-b-2 border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[10px] uppercase font-black text-amber-700 tracking-widest bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                Institutional Refinancing & Savings Analysis
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                Home Loan Balance Transfer Audit
              </h2>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Prepared Exclusively For</span>
              <p className="text-base sm:text-lg font-black text-slate-900">{inputs.clientName}</p>
              <p className="text-xs text-slate-500 font-mono">{inputs.mobile}</p>
            </div>
          </div>

          {/* Section 1: Verified Loan Profile */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Existing Lender</span>
              <strong className="text-xs sm:text-sm font-bold text-slate-900">{inputs.currentLender}</strong>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Outstanding Balance</span>
              <strong className="text-xs sm:text-sm font-black font-mono text-slate-900">
                ₹{inputs.outstandingPrincipal.toLocaleString('en-IN')}
              </strong>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Current Debited EMI</span>
              <strong className="text-xs sm:text-sm font-black font-mono text-slate-900">
                ₹{inputs.currentEmi.toLocaleString('en-IN')}/mo
              </strong>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Verified Remaining Tenure</span>
              <strong className="text-xs sm:text-sm font-black text-amber-700">
                {results.activeRemainingTenure} Mos ({Math.floor(results.activeRemainingTenure / 12)} Yrs {results.activeRemainingTenure % 12} Mos)
              </strong>
            </div>
          </div>

          {/* Section 2: Big Impact Highlight Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 shadow-xs">
              <span className="text-[10px] uppercase font-extrabold text-amber-800 tracking-wider">Proposed Rate</span>
              <p className="text-2xl sm:text-3xl font-black text-amber-900 font-mono mt-0.5">
                {inputs.proposedRate}%
              </p>
              <span className="text-[10px] text-amber-700 font-semibold">
                -{(inputs.currentRate - inputs.proposedRate).toFixed(2)}% drop
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 shadow-xs">
              <span className="text-[10px] uppercase font-extrabold text-blue-800 tracking-wider">
                {inputs.strategy === 'FASTER_PAYOFF' ? 'Time Saved' : 'Monthly Cash Relief'}
              </span>
              <p className="text-2xl sm:text-3xl font-black text-blue-900 font-mono mt-0.5">
                {inputs.strategy === 'FASTER_PAYOFF'
                  ? `${results.monthsSaved} Mos`
                  : `₹${results.monthlyEmiReduction.toLocaleString('en-IN')}`}
              </p>
              <span className="text-[10px] text-blue-700 font-semibold">
                {inputs.strategy === 'FASTER_PAYOFF' ? 'earlier loan freedom' : 'saved per month'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-300 shadow-xs">
              <span className="text-[10px] uppercase font-extrabold text-emerald-800 tracking-wider">Net Financial Gain</span>
              <p className="text-2xl sm:text-3xl font-black text-emerald-900 font-mono mt-0.5">
                ₹{Math.round(results.netSaving).toLocaleString('en-IN')}
              </p>
              <span className="text-[10px] text-emerald-700 font-semibold">
                after ₹{inputs.transferCosts.toLocaleString('en-IN')} costs
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs">
              <span className="text-[10px] uppercase font-extrabold text-slate-600 tracking-wider">Break-Even Horizon</span>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 font-mono mt-0.5">
                {inputs.strategy === 'FASTER_PAYOFF' ? 'Immediate' : `${results.breakEvenMonths} Mos`}
              </p>
              <span className="text-[10px] text-slate-500 font-semibold">
                {inputs.strategy === 'FASTER_PAYOFF' ? 'amortization advantage' : 'complete cost recovery'}
              </span>
            </div>
          </div>

          {/* Section 3: Comparative Amortization Ledger */}
          <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="bg-slate-100/80 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                Full Amortization & Cash Flow Comparison
              </h4>
              <span className="text-[10px] text-slate-500 font-semibold">Verified against standard banking formula</span>
            </div>
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 bg-slate-50/50 text-[11px] font-bold">
                  <th className="py-2.5 px-4">Financial Parameter</th>
                  <th className="py-2.5 px-4 text-right">Current Bank ({inputs.currentLender})</th>
                  <th className="py-2.5 px-4 text-right bg-emerald-50/30 text-emerald-900">Proposed Refinanced Loan</th>
                  <th className="py-2.5 px-4 text-right text-emerald-700 font-bold">Your Direct Advantage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                <tr>
                  <td className="py-2.5 px-4 text-slate-700 font-sans font-medium">Annual Interest Rate</td>
                  <td className="py-2.5 px-4 text-right text-slate-900">{inputs.currentRate.toFixed(2)}%</td>
                  <td className="py-2.5 px-4 text-right font-bold text-emerald-800 bg-emerald-50/20">{inputs.proposedRate.toFixed(2)}%</td>
                  <td className="py-2.5 px-4 text-right text-emerald-700 font-bold">
                    -{(inputs.currentRate - inputs.proposedRate).toFixed(2)}%
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-slate-700 font-sans font-medium">Monthly EMI Outflow</td>
                  <td className="py-2.5 px-4 text-right text-slate-900">₹{inputs.currentEmi.toLocaleString('en-IN')}</td>
                  <td className="py-2.5 px-4 text-right font-bold text-slate-900 bg-emerald-50/20">₹{results.newEmi.toLocaleString('en-IN')}</td>
                  <td className="py-2.5 px-4 text-right text-emerald-700 font-bold">
                    {results.monthlyEmiReduction > 0 ? `-₹${results.monthlyEmiReduction.toLocaleString('en-IN')}/mo` : 'Same EMI'}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-slate-700 font-sans font-medium">Remaining Repayment Tenure</td>
                  <td className="py-2.5 px-4 text-right text-slate-900">{results.activeRemainingTenure} Months</td>
                  <td className="py-2.5 px-4 text-right font-bold text-slate-900 bg-emerald-50/20">{results.newTenureMonths} Months</td>
                  <td className="py-2.5 px-4 text-right text-emerald-700 font-bold">
                    {results.monthsSaved > 0 ? `-${results.monthsSaved} Months Sooner` : 'Same Tenure'}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-slate-700 font-sans font-medium">Total Remaining Interest Outgo</td>
                  <td className="py-2.5 px-4 text-right text-slate-900">₹{Math.round(results.currentRemainingInterest).toLocaleString('en-IN')}</td>
                  <td className="py-2.5 px-4 text-right font-bold text-slate-900 bg-emerald-50/20">₹{Math.round(results.newTotalInterest).toLocaleString('en-IN')}</td>
                  <td className="py-2.5 px-4 text-right text-emerald-700 font-bold">
                    -₹{Math.round(results.grossInterestSaving).toLocaleString('en-IN')}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-slate-700 font-sans font-medium">Est. Switch Costs (MODT, Legal, Admin)</td>
                  <td className="py-2.5 px-4 text-right text-slate-400">—</td>
                  <td className="py-2.5 px-4 text-right text-slate-600 bg-emerald-50/20">₹{inputs.transferCosts.toLocaleString('en-IN')}</td>
                  <td className="py-2.5 px-4 text-right text-slate-400">One-time expense</td>
                </tr>
                <tr className="bg-emerald-50/60 text-emerald-950 font-bold text-sm">
                  <td className="py-3 px-4 font-sans">NET VERIFIED FINANCIAL BENEFIT</td>
                  <td className="py-3 px-4 text-right text-slate-400">—</td>
                  <td className="py-3 px-4 text-right">—</td>
                  <td className="py-3 px-4 text-right text-emerald-800 text-base">
                    +₹{Math.round(results.netSaving).toLocaleString('en-IN')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 4: The Wealth Multiplier Opportunity (Cross-Sell / Compounding Engine) */}
          {results.monthlyEmiReduction > 0 && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-50/90 via-amber-100/40 to-amber-50/90 border border-amber-300/80 space-y-2.5 shadow-xs">
              <div className="flex items-center gap-2 text-amber-900">
                <TrendingUp className="w-5 h-5 text-amber-600" />
                <h4 className="font-extrabold text-sm sm:text-base">
                  The Wealth Multiplier: What If You Re-invest Your EMI Savings?
                </h4>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                Rather than letting the monthly saving of <strong>₹{results.monthlyEmiReduction.toLocaleString('en-IN')}</strong> get absorbed into daily living expenses, routing this exact surplus into a disciplined <strong>Wealth Creation SIP (at an assumed 12% CAGR)</strong> over your remaining {results.activeRemainingTenure} months transforms your loan balance transfer into an automatic wealth generation engine:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="bg-white p-3 rounded-xl border border-amber-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Monthly SIP Contribution</span>
                  <p className="text-base font-black text-slate-900 font-mono">₹{results.monthlyEmiReduction.toLocaleString('en-IN')}/mo</p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-amber-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Capital Invested</span>
                  <p className="text-base font-black text-slate-900 font-mono">₹{totalSipInvested.toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-amber-300 bg-amber-50/40">
                  <span className="text-[10px] uppercase font-bold text-amber-800">Projected Wealth Corpus (@ 12%)</span>
                  <p className="text-base font-black text-emerald-700 font-mono">₹{sipFutureValue.toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>
          )}

          {/* Section 5: The Wise Ant Advisory Verdict Card */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start gap-4">
            <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-amber-500/40 shadow-sm flex-shrink-0 bg-slate-950">
              <img src="/logo.png" alt="The Wise Ant" className="w-full h-full object-cover" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-800">
                  The Wise Ant Advisory Verdict
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                  {results.decisionBadge}
                </span>
              </div>
              <p className="text-xs sm:text-sm font-medium text-slate-800 italic">
                "{results.wiseAntMessage}"
              </p>
              <p className="text-xs text-slate-600 pt-1">
                <strong>Our Recommendation:</strong> {results.conclusionText}
              </p>
            </div>
          </div>

          {/* Section 6: Official Report Footer Strip with Rana Sahib & ARN-94204 */}
          <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 text-white p-5 sm:p-6 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-400 block tracking-wider">Financial Advisory Lead</span>
                <strong className="text-sm font-bold text-white">Rana Sahib</strong>
                <p className="text-slate-400 text-[11px] mt-0.5">AMFI Regd. Mutual Fund Distributor & SIFD</p>
                <p className="font-mono text-amber-300 font-bold text-[11px]">ARN-94204</p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-amber-400 block tracking-wider">Direct Contact & Helpline</span>
                <p className="text-white font-mono font-bold mt-0.5">+91 98727 00392</p>
                <p className="text-slate-300 text-[11px]">ranasahib@antfinserv.com</p>
                <p className="text-slate-400 text-[11px]">AntFinServ.com</p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-amber-400 block tracking-wider">Next Steps For Fast Execution</span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  1. Request LOD (List of Documents) from {inputs.currentLender}.
                  <br />2. Obtain updated Foreclosure Statement.
                  <br />3. AntFinServ coordinates door-step documentation.
                </p>
              </div>
            </div>

            <p className="text-[9px] text-slate-400 text-center leading-relaxed">
              Disclaimer: This report is an analytical comparison based on actual loan data provided by the borrower and prevailing bank lending rates. Mutual Fund investments are subject to market risks; read all scheme-related documents carefully before investing. AntFinServ is committed to 100% transparent and honest financial guidance.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
