import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Printer,
  Phone,
  CheckCircle2,
  TrendingUp,
  Clock,
  ArrowRight,
  TrendingDown,
  Calendar,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
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
  const refNumber = `AFS/HL-${Date.now().toString().slice(-6)}`;
  const todayDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const clientNameClean = (inputs.clientName || 'CLIENT').trim().toUpperCase();
  const defaultDocTitle = `${clientNameClean}_BT VERDICT_BY_ANTFINSERV.COM`;

  // Manage body class and document.title when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const prevTitle = document.title;
    document.title = defaultDocTitle;
    document.body.classList.add('report-modal-open');

    return () => {
      document.title = prevTitle;
      document.body.classList.remove('report-modal-open');
      document.body.classList.remove('printing-report');
    };
  }, [isOpen, defaultDocTitle]);

  if (!isOpen) return null;

  const handlePrint = () => {
    document.body.classList.add('printing-report');
    document.title = defaultDocTitle;

    const cleanup = () => {
      document.body.classList.remove('printing-report');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);

    window.print();

    setTimeout(() => {
      document.body.classList.remove('printing-report');
    }, 2000);
  };

  const handleWhatsApp = () => {
    const msg = `Dear ${inputs.clientName},
    
Please find your Official AntFinServ Home Loan Balance Transfer & Refinancing Audit (Ref: ${refNumber}).

VERIFIED CURRENT LOAN:
• Outstanding Principal: ₹${inputs.outstandingPrincipal.toLocaleString('en-IN')}
• Current Rate & EMI: ${inputs.currentRate}% (₹${inputs.currentEmi.toLocaleString('en-IN')}/mo)
• Verified Remaining Tenure: ${results.activeRemainingTenure} Months

STRATEGY 1 (LOWER MONTHLY EMI):
• New Reduced EMI: ₹${results.pathA_LowerEmi.newEmi.toLocaleString('en-IN')}/mo (Drop of ₹${results.pathA_LowerEmi.monthlyEmiReduction.toLocaleString('en-IN')}/mo)
• Net Lifetime Gain: ₹${Math.round(results.pathA_LowerEmi.netSaving).toLocaleString('en-IN')} (After ₹${inputs.transferCosts.toLocaleString('en-IN')} costs)
• Break-Even Period: ${results.pathA_LowerEmi.breakEvenMonths} Months

STRATEGY 2 (FASTER DEBT FREEDOM):
• Pay Same EMI: ₹${inputs.currentEmi.toLocaleString('en-IN')}/mo
• Loan Finished: ${results.pathB_FasterPayoff.monthsSaved} Months Earlier (${(results.pathB_FasterPayoff.monthsSaved / 12).toFixed(1)} Yrs Sooner!)
• Net Lifetime Gain: ₹${Math.round(results.pathB_FasterPayoff.netSaving).toLocaleString('en-IN')}

Official 2-Page Sanction Audit prepared by AntFinServ.com (ARN-94204 • Rana Sahib).`;
    const url = generateWhatsAppUrl(inputs.mobile, msg);
    window.open(url, '_blank');
  };

  // Option 1 SIP Wealth Multiplier
  const monthlySavingA = results.pathA_LowerEmi.monthlyEmiReduction;
  const nA = results.activeRemainingTenure;
  const i = 0.12 / 12;
  const sipFutureValue = monthlySavingA > 0
    ? Math.round(monthlySavingA * ((Math.pow(1 + i, nA) - 1) / i) * (1 + i))
    : 0;
  const totalSipInvested = monthlySavingA * nA;

  const modalContent = (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-start justify-center p-2 sm:p-4 md:p-6 print:p-0 print:bg-white print:static print:inset-auto print:overflow-visible">
      <div className="bg-white text-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-4 sm:my-6 print:border-none print:shadow-none print:rounded-none print:max-w-none print:my-0 print:w-full">
        
        {/* Modal Top Action Bar (Hidden on Print) */}
        <div className="p-4 sm:px-6 bg-slate-900 text-white flex items-center justify-between print-hidden border-b border-slate-800 sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Official 2-Page Executive Sanction Audit</span>
            </span>
            <span className="text-xs font-mono text-slate-400 hidden sm:inline">Ref: {refNumber}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              title="Prints 2-Page PDF with both Option 1 & Option 2"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={handleWhatsApp}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Phone className="w-4 h-4" />
              <span>Share WhatsApp</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all ml-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Container */}
        <div id="printable-verdict-report" className="w-full bg-white print:p-0">
          
          {/* ========================================================================= */}
          {/* PAGE 1: Executive Audit & Strategy 1 (Reduce Monthly Outgo)               */}
          {/* ========================================================================= */}
          <section className="print-page p-6 sm:p-10 space-y-4">
            
            {/* Executive Header Banner */}
            <div className="rounded-2xl overflow-hidden border border-amber-500/30 shadow-xs bg-slate-950 text-white">
              <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-slate-950 via-[#0b132b] to-slate-950">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 border-amber-400/40 shadow-lg flex-shrink-0 bg-slate-900">
                    <img src="/logo.png" alt="AntFinServ" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                        AntFinServ<span className="text-amber-400">.com</span>
                      </h1>
                      <span className="text-[9px] sm:text-xs font-bold px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/40">
                        AMFI REGD. MFD ARN-94204
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 font-medium tracking-wide">
                      PLANNING YOUR FINANCES. BUILDING YOUR WEALTH.
                    </p>
                    <p className="text-[10px] text-amber-400/90 font-mono">
                      INSIGHTS • WEALTH • GROWTH
                    </p>
                  </div>
                </div>

                <div className="text-right sm:border-l sm:border-slate-800 sm:pl-4 w-full sm:w-auto flex flex-row sm:flex-col justify-between sm:justify-center">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">Document Ref</span>
                    <span className="text-xs font-mono font-bold text-amber-400">{refNumber}</span>
                  </div>
                  <div className="mt-1">
                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">Audit Date</span>
                    <span className="text-xs text-slate-200">{todayDate}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Document Title & Client Profile */}
            <div className="border-b-2 border-slate-100 pb-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[9px] uppercase font-black text-amber-700 tracking-widest bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Institutional Refinancing & Savings Analysis
                </span>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                  Home Loan Balance Transfer Audit
                </h2>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Prepared Exclusively For</span>
                <p className="text-base sm:text-lg font-black text-slate-900">{inputs.clientName}</p>
                <p className="text-xs text-slate-500 font-mono">{inputs.mobile}</p>
              </div>
            </div>

            {/* Verified Loan Baseline Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Existing Lender</span>
                <strong className="text-xs sm:text-sm font-bold text-slate-900">{inputs.currentLender}</strong>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Outstanding Balance</span>
                <strong className="text-xs sm:text-sm font-black font-mono text-slate-900">
                  ₹{inputs.outstandingPrincipal.toLocaleString('en-IN')}
                </strong>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Current Debited EMI</span>
                <strong className="text-xs sm:text-sm font-black font-mono text-slate-900">
                  ₹{inputs.currentEmi.toLocaleString('en-IN')}/mo
                </strong>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Verified Remaining Tenure</span>
                <strong className="text-xs sm:text-sm font-black text-amber-700">
                  {results.activeRemainingTenure} Mos ({Math.floor(results.activeRemainingTenure / 12)} Yrs {results.activeRemainingTenure % 12} Mos)
                </strong>
              </div>
            </div>

            {/* Option 1 Section Header */}
            <div className="bg-amber-50/70 border border-amber-300/80 p-2.5 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-amber-700" />
                <span className="text-xs font-black text-amber-950 uppercase tracking-wide">
                  STRATEGY 1: REDUCE MONTHLY CASH OUTFLOW (Keep Same {results.activeRemainingTenure} Mos Tenure)
                </span>
              </div>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-900">
                Cash Relief Path
              </span>
            </div>

            {/* Option 1 Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Proposed Rate</span>
                <p className="text-xl font-black text-slate-900 font-mono mt-0.5">
                  {inputs.proposedRate}%
                </p>
                <span className="text-[10px] text-emerald-700 font-semibold">
                  -{(inputs.currentRate - inputs.proposedRate).toFixed(2)}% drop
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200">
                <span className="text-[9px] uppercase font-bold text-blue-800 block">New Reduced EMI</span>
                <p className="text-xl font-black text-blue-900 font-mono mt-0.5">
                  ₹{results.pathA_LowerEmi.newEmi.toLocaleString('en-IN')}
                </p>
                <span className="text-[10px] text-blue-700 font-bold">
                  ₹{results.pathA_LowerEmi.monthlyEmiReduction.toLocaleString('en-IN')}/mo saved
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-300">
                <span className="text-[9px] uppercase font-bold text-emerald-800 block">Net Financial Gain</span>
                <p className="text-xl font-black text-emerald-900 font-mono mt-0.5">
                  ₹{Math.round(results.pathA_LowerEmi.netSaving).toLocaleString('en-IN')}
                </p>
                <span className="text-[10px] text-emerald-700 font-semibold">
                  after ₹{inputs.transferCosts.toLocaleString('en-IN')} costs
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[9px] uppercase font-bold text-slate-500 block">Break-Even Horizon</span>
                <p className="text-xl font-black text-slate-900 font-mono mt-0.5">
                  {results.pathA_LowerEmi.breakEvenMonths} Mos
                </p>
                <span className="text-[10px] text-slate-500 font-semibold">
                  full cost recovery
                </span>
              </div>
            </div>

            {/* Option 1 Amortization Ledger */}
            <div className="rounded-xl border border-slate-200 overflow-hidden shadow-xs text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 bg-slate-50/80 text-[10px] font-bold">
                    <th className="py-2 px-3">Financial Parameter</th>
                    <th className="py-2 px-3 text-right">Current Bank ({inputs.currentLender})</th>
                    <th className="py-2 px-3 text-right bg-amber-50/40 text-slate-900">Strategy 1 Refinancing</th>
                    <th className="py-2 px-3 text-right text-emerald-700 font-bold">Direct Client Benefit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  <tr>
                    <td className="py-1.5 px-3 text-slate-700 font-sans font-medium">Annual Interest Rate</td>
                    <td className="py-1.5 px-3 text-right text-slate-900">{inputs.currentRate.toFixed(2)}%</td>
                    <td className="py-1.5 px-3 text-right font-bold text-slate-900 bg-amber-50/20">{inputs.proposedRate.toFixed(2)}%</td>
                    <td className="py-1.5 px-3 text-right text-emerald-700 font-bold">
                      -{(inputs.currentRate - inputs.proposedRate).toFixed(2)}%
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 text-slate-700 font-sans font-medium">Monthly Outflow (EMI)</td>
                    <td className="py-1.5 px-3 text-right text-slate-900">₹{inputs.currentEmi.toLocaleString('en-IN')}</td>
                    <td className="py-1.5 px-3 text-right font-bold text-slate-900 bg-amber-50/20">₹{results.pathA_LowerEmi.newEmi.toLocaleString('en-IN')}</td>
                    <td className="py-1.5 px-3 text-right text-emerald-700 font-bold">
                      -₹{results.pathA_LowerEmi.monthlyEmiReduction.toLocaleString('en-IN')}/mo
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 text-slate-700 font-sans font-medium">Total Remaining Interest</td>
                    <td className="py-1.5 px-3 text-right text-slate-900">₹{Math.round(results.currentRemainingInterest).toLocaleString('en-IN')}</td>
                    <td className="py-1.5 px-3 text-right font-bold text-slate-900 bg-amber-50/20">₹{Math.round(results.pathA_LowerEmi.newTotalInterest).toLocaleString('en-IN')}</td>
                    <td className="py-1.5 px-3 text-right text-emerald-700 font-bold">
                      -₹{Math.round(results.pathA_LowerEmi.grossInterestSaving).toLocaleString('en-IN')}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 text-slate-700 font-sans font-medium">Transfer Costs (MODT, Legal, Admin)</td>
                    <td className="py-1.5 px-3 text-right text-slate-400">—</td>
                    <td className="py-1.5 px-3 text-right text-slate-600 bg-amber-50/20">₹{inputs.transferCosts.toLocaleString('en-IN')}</td>
                    <td className="py-1.5 px-3 text-right text-slate-400">One-time expense</td>
                  </tr>
                  <tr className="bg-emerald-50/60 font-bold">
                    <td className="py-2 px-3 text-emerald-950 font-sans">NET VERIFIED FINANCIAL GAIN</td>
                    <td className="py-2 px-3 text-right text-slate-400">—</td>
                    <td className="py-2 px-3 text-right">—</td>
                    <td className="py-2 px-3 text-right text-emerald-800 text-sm">
                      +₹{Math.round(results.pathA_LowerEmi.netSaving).toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Wealth Multiplier Cross-Sell */}
            {monthlySavingA > 0 && (
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-50 via-amber-100/30 to-amber-50 border border-amber-300/80 space-y-1 shadow-xs">
                <div className="flex items-center gap-1.5 text-amber-900">
                  <TrendingUp className="w-4 h-4 text-amber-600" />
                  <h4 className="font-extrabold text-xs">
                    The Wealth Multiplier: Re-investing Your ₹{monthlySavingA.toLocaleString('en-IN')}/mo EMI Savings
                  </h4>
                </div>
                <p className="text-[10px] text-slate-700 leading-relaxed">
                  Routing your monthly savings into a disciplined <strong>Wealth Creation SIP (assumed 12% CAGR)</strong> over your remaining {nA} months transforms your loan balance transfer into an automatic wealth generation engine:
                </p>
                <div className="grid grid-cols-3 gap-2 pt-0.5 text-center font-mono">
                  <div className="bg-white p-1.5 rounded-lg border border-amber-200">
                    <span className="text-[8px] uppercase font-bold text-slate-400 block font-sans">Monthly SIP</span>
                    <strong className="text-xs text-slate-900 font-black">₹{monthlySavingA.toLocaleString('en-IN')}/mo</strong>
                  </div>
                  <div className="bg-white p-1.5 rounded-lg border border-amber-200">
                    <span className="text-[8px] uppercase font-bold text-slate-400 block font-sans">Capital Invested</span>
                    <strong className="text-xs text-slate-900 font-black">₹{totalSipInvested.toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="bg-white p-1.5 rounded-lg border border-amber-300 bg-amber-50/50">
                    <span className="text-[8px] uppercase font-bold text-amber-800 block font-sans">Projected Wealth Corpus</span>
                    <strong className="text-xs text-emerald-700 font-black">₹{sipFutureValue.toLocaleString('en-IN')}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Page 1 Sub-Footer Notice */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
              <span>AntFinServ Advisory Report • Reference: {refNumber}</span>
              <span className="font-bold text-amber-800">Turn to Page 2 for Strategy 2 (Faster Debt Freedom) & Final Sign-Off ➔</span>
              <span>Page 1 of 2</span>
            </div>

          </section>


          {/* ========================================================================= */}
          {/* PAGE 2: Strategy 2 (Faster Debt Freedom) & Final Sign-Off                  */}
          {/* ========================================================================= */}
          <section className="print-page print-page-last p-6 sm:p-10 space-y-4 border-t-4 border-slate-100 print:border-t-0">
            
            {/* Page 2 Slim Top Banner */}
            <div className="bg-slate-950 text-white px-4 py-2.5 rounded-xl flex items-center justify-between border border-amber-500/20">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg overflow-hidden border border-amber-400/40 bg-slate-900 flex-shrink-0">
                  <img src="/logo.png" alt="AntFinServ" className="w-full h-full object-cover" />
                </div>
                <div>
                  <span className="text-xs font-black tracking-tight text-white">
                    AntFinServ<span className="text-amber-400">.com</span>
                  </span>
                  <span className="text-[9px] text-slate-300 ml-2 font-mono hidden sm:inline">ARN-94204</span>
                </div>
              </div>
              <div className="text-right text-[11px]">
                <span className="text-slate-400">Client: </span>
                <strong className="text-amber-300">{inputs.clientName}</strong>
                <span className="text-slate-500 font-mono ml-2">({refNumber})</span>
              </div>
            </div>

            {/* Option 2 Section Header */}
            <div className="bg-emerald-50/80 border border-emerald-300/90 p-2.5 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-black text-emerald-950 uppercase tracking-wide">
                  STRATEGY 2: ACCELERATED DEBT FREEDOM (Maintain Current ₹{inputs.currentEmi.toLocaleString('en-IN')} EMI)
                </span>
              </div>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-200 text-emerald-900">
                Faster Payoff Path
              </span>
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed -mt-1">
              If your current monthly cash flow is comfortable, maintaining your existing ₹{inputs.currentEmi.toLocaleString('en-IN')} EMI at {inputs.proposedRate}% accelerates principal repayment dramatically. You become 100% debt-free months ahead of schedule without paying an extra single rupee from your monthly budget!
            </p>

            {/* Option 2 Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Maintained EMI</span>
                <p className="text-xl font-black text-slate-900 font-mono mt-0.5">
                  ₹{inputs.currentEmi.toLocaleString('en-IN')}
                </p>
                <span className="text-[10px] text-slate-500 font-semibold">
                  0 budget change
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                <span className="text-[9px] uppercase font-bold text-emerald-800 block">New Remaining Tenure</span>
                <p className="text-xl font-black text-emerald-900 font-mono mt-0.5">
                  {results.pathB_FasterPayoff.newTenureMonths} Mos
                </p>
                <span className="text-[10px] text-emerald-700 font-bold">
                  {results.pathB_FasterPayoff.monthsSaved} Months sooner!
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-300">
                <span className="text-[9px] uppercase font-bold text-emerald-800 block">Net Financial Gain</span>
                <p className="text-xl font-black text-emerald-900 font-mono mt-0.5">
                  ₹{Math.round(results.pathB_FasterPayoff.netSaving).toLocaleString('en-IN')}
                </p>
                <span className="text-[10px] text-emerald-700 font-semibold">
                  after ₹{inputs.transferCosts.toLocaleString('en-IN')} costs
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[9px] uppercase font-bold text-slate-500 block">Break-Even Drag</span>
                <p className="text-xl font-black text-slate-900 font-mono mt-0.5">
                  Immediate
                </p>
                <span className="text-[10px] text-slate-500 font-semibold">
                  pure principal payoff
                </span>
              </div>
            </div>

            {/* Side-by-Side Comparison of Both Strategies */}
            <div className="rounded-xl border border-slate-200 overflow-hidden text-xs">
              <div className="bg-slate-100/90 px-3 py-1.5 border-b border-slate-200 flex items-center justify-between">
                <span className="font-extrabold text-slate-800 uppercase text-[10px] tracking-wide">
                  Strategic Advisor Comparison: Which Path Suits You Best?
                </span>
                <span className="text-[9px] text-slate-500 font-semibold">Institutional Assessment</span>
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 bg-slate-50/80 text-[10px] font-bold">
                    <th className="py-1.5 px-3">Comparison Point</th>
                    <th className="py-1.5 px-3 bg-amber-50/30 text-amber-950">Strategy 1 (Lower Monthly EMI)</th>
                    <th className="py-1.5 px-3 bg-emerald-50/30 text-emerald-950">Strategy 2 (Faster Debt Freedom)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-1.5 px-3 font-medium text-slate-700">Client Primary Objective</td>
                    <td className="py-1.5 px-3 text-slate-800 bg-amber-50/10">Maximum monthly cash flow relief</td>
                    <td className="py-1.5 px-3 text-slate-800 bg-emerald-50/10 font-semibold">Fastest possible path to a debt-free home</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 font-medium text-slate-700">Monthly EMI</td>
                    <td className="py-1.5 px-3 font-mono font-bold text-slate-900 bg-amber-50/10">
                      ₹{results.pathA_LowerEmi.newEmi.toLocaleString('en-IN')} (-₹{results.pathA_LowerEmi.monthlyEmiReduction.toLocaleString('en-IN')})
                    </td>
                    <td className="py-1.5 px-3 font-mono font-bold text-slate-900 bg-emerald-50/10">
                      ₹{inputs.currentEmi.toLocaleString('en-IN')} (Unchanged)
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 font-medium text-slate-700">Total Loan Tenure</td>
                    <td className="py-1.5 px-3 font-mono text-slate-900 bg-amber-50/10">
                      {results.activeRemainingTenure} Months
                    </td>
                    <td className="py-1.5 px-3 font-mono font-bold text-emerald-800 bg-emerald-50/10">
                      {results.pathB_FasterPayoff.newTenureMonths} Months (-{results.pathB_FasterPayoff.monthsSaved} Mos Sooner)
                    </td>
                  </tr>
                  <tr className="font-bold">
                    <td className="py-1.5 px-3 text-slate-900">Net Lifetime Savings</td>
                    <td className="py-1.5 px-3 font-mono text-amber-800 bg-amber-50/30">
                      +₹{Math.round(results.pathA_LowerEmi.netSaving).toLocaleString('en-IN')}
                    </td>
                    <td className="py-1.5 px-3 font-mono text-emerald-800 bg-emerald-50/30">
                      +₹{Math.round(results.pathB_FasterPayoff.netSaving).toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* The Wise Ant Advisory Verdict */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl overflow-hidden border-2 border-amber-500/40 shadow-xs flex-shrink-0 bg-slate-950">
                <img src="/logo.png" alt="The Wise Ant" className="w-full h-full object-cover" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-amber-800">
                    The Wise Ant Advisory Verdict
                  </h4>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                    {results.decisionBadge}
                  </span>
                </div>
                <p className="text-[11px] font-medium text-slate-800 italic leading-snug">
                  "{results.wiseAntMessage}"
                </p>
                <p className="text-[10px] text-slate-600 pt-0.5">
                  <strong>Recommended Action:</strong> {results.conclusionText}
                </p>
              </div>
            </div>

            {/* Official Footer Strip with Rana Sahib & ARN-94204 */}
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-950 text-white p-3.5 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs border-b border-slate-800 pb-2.5">
                <div>
                  <span className="text-[9px] uppercase font-bold text-amber-400 block tracking-wider">Advisory Lead</span>
                  <strong className="text-xs font-bold text-white">Rana Sahib</strong>
                  <p className="text-slate-400 text-[10px]">AMFI Regd. Mutual Fund Distributor</p>
                  <p className="font-mono text-amber-300 font-bold text-[10px]">ARN-94204</p>
                </div>

                <div>
                  <span className="text-[9px] uppercase font-bold text-amber-400 block tracking-wider">Direct Contact & Helpline</span>
                  <p className="text-white font-mono font-bold">+91 98727 00392</p>
                  <p className="text-slate-300 text-[10px]">ranasahib@antfinserv.com</p>
                  <p className="text-slate-400 text-[10px]">AntFinServ.com</p>
                </div>

                <div>
                  <span className="text-[9px] uppercase font-bold text-amber-400 block tracking-wider">Balance Transfer Next Steps</span>
                  <p className="text-slate-300 text-[9px] leading-relaxed">
                    1. Apply for LOD & Foreclosure Letter from {inputs.currentLender}.
                    <br />2. Doorstep documentation by AntFinServ.
                    <br />3. Seamless takeover & cheque disbursement.
                  </p>
                </div>
              </div>

              <p className="text-[8px] text-slate-400 text-center leading-tight">
                Disclaimer: Analytical comparison based on borrower-provided statements and current bank rate sheets. Mutual Fund investments are subject to market risks; read scheme-related documents carefully. AntFinServ is committed to transparent, conflict-free financial advisory.
              </p>
            </div>

            {/* Page 2 Bottom Footer */}
            <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
              <span>AntFinServ Advisory Report • Ref: {refNumber}</span>
              <span className="font-semibold text-slate-600">End of Report • Prepared for {inputs.clientName}</span>
              <span>Page 2 of 2</span>
            </div>

          </section>

        </div>
      </div>
    </div>
  );

  // Mount to print-root if available, else body
  const printRoot = typeof document !== 'undefined' ? (document.getElementById('print-root') || document.body) : null;
  return printRoot ? createPortal(modalContent, printRoot) : modalContent;
};
