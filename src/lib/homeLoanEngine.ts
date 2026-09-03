/**
 * ANTFINSERV Cutting-Edge Home Loan Balance Transfer Decision Engine
 * - Reverse Amortization: Auto-calculates exact outstanding tenure from Principal, Rate, and current EMI
 * - Multi-Strategy Decision Matrix:
 *   1. Strategy A: Lower EMI (Keep Same Tenure)
 *   2. Strategy B: Faster Debt Freedom (Maintain Current EMI)
 *   3. Strategy C: Cash Flow Optimization (Custom / Extended Tenure)
 */

export interface HomeLoanInputs {
  clientName: string;
  mobile: string;
  currentLender: string;
  outstandingPrincipal: number;
  currentRate: number; // in % e.g. 8.1
  currentEmi: number; // e.g. 27774
  proposedRate: number; // in % e.g. 7.35
  transferCosts: number; // e.g. 25000
  tenureMode?: 'AUTO' | 'MANUAL';
  manualTenureMonths?: number;
  strategy?: 'LOWER_EMI' | 'FASTER_PAYOFF' | 'CUSTOM_TENURE';
  customTenureMonths?: number;
}

export interface StrategyDetail {
  newEmi: number;
  newTenureMonths: number;
  monthlyEmiReduction: number;
  monthsSaved: number;
  grossInterestSaving: number;
  netSaving: number;
  breakEvenMonths: number;
  newTotalPayment: number;
  newTotalInterest: number;
  isBeneficial: boolean;
}

export interface HomeLoanResults {
  // Computed Baseline for Current Loan
  computedTenureMonths: number;
  computedTenureYears: number;
  computedTenureRemMonths: number;
  isEmiFeasible: boolean;
  minRequiredEmi: number;
  currentTotalPayment: number;
  currentRemainingInterest: number;
  activeRemainingTenure: number;

  // Multi-Strategy Outcomes
  pathA_LowerEmi: StrategyDetail;
  pathB_FasterPayoff: StrategyDetail;
  pathC_Custom: StrategyDetail;

  // Active Selected Strategy Output
  selectedStrategy: 'LOWER_EMI' | 'FASTER_PAYOFF' | 'CUSTOM_TENURE';
  newEmi: number;
  newTenureMonths: number;
  monthlyEmiReduction: number;
  monthsSaved: number;
  grossInterestSaving: number;
  netSaving: number;
  breakEvenMonths: number;
  newTotalPayment: number;
  newTotalInterest: number;
  isBeneficial: boolean;
  decision: 'RECOMMEND_TRANSFER' | 'BORDERLINE' | 'NO_TRANSFER';
  decisionBadge: string;
  decisionText: string;
  conclusionText: string;
  wiseAntMessage: string;
}

/**
 * Accurately calculates remaining tenure in months from Principal, Annual Interest Rate, and EMI.
 * Formula: N = -ln(1 - (P * r / EMI)) / ln(1 + r)
 */
export function calculateTenureFromEmi(
  principal: number,
  annualRatePercent: number,
  emi: number
): {
  isFeasible: boolean;
  exactMonths: number;
  months: number;
  years: number;
  remMonths: number;
  minRequiredEmi: number;
} {
  if (principal <= 0 || emi <= 0) {
    return { isFeasible: false, exactMonths: 0, months: 0, years: 0, remMonths: 0, minRequiredEmi: 0 };
  }

  const r = (annualRatePercent / 100) / 12;
  const monthlyInterest = principal * r;

  // If EMI is less than or equal to monthly interest, principal will never be repaid
  if (emi <= monthlyInterest) {
    return {
      isFeasible: false,
      exactMonths: 0,
      months: 0,
      years: 0,
      remMonths: 0,
      minRequiredEmi: Math.ceil(monthlyInterest + 100)
    };
  }

  const ratio = 1 - (monthlyInterest / emi);
  const n = -Math.log(ratio) / Math.log(1 + r);
  const roundedMonths = Math.max(1, Math.round(n));
  const years = Math.floor(roundedMonths / 12);
  const remMonths = roundedMonths % 12;

  return {
    isFeasible: true,
    exactMonths: n,
    months: roundedMonths,
    years,
    remMonths,
    minRequiredEmi: Math.ceil(monthlyInterest)
  };
}

/**
 * Standard Loan Amortization EMI Calculation:
 * EMI = P * r * (1+r)^N / ((1+r)^N - 1)
 */
export function calculateEmiFromTenure(
  principal: number,
  annualRatePercent: number,
  tenureMonths: number
): number {
  if (principal <= 0 || tenureMonths <= 0) return 0;
  const r = (annualRatePercent / 100) / 12;
  if (r === 0) return principal / tenureMonths;

  const factor = Math.pow(1 + r, tenureMonths);
  if (!isFinite(factor) || factor <= 1) return principal / tenureMonths;

  return (principal * r * factor) / (factor - 1);
}

/**
 * ANTFINSERV Cutting-Edge Balance Transfer Evaluator
 */
export function calculateHomeLoanBT(inputs: HomeLoanInputs): HomeLoanResults {
  const P = Math.max(0, inputs.outstandingPrincipal);
  const currRate = Math.max(0.1, inputs.currentRate);
  const propRate = Math.max(0.1, inputs.proposedRate);
  const currEmi = Math.max(0, inputs.currentEmi);
  const costs = Math.max(0, inputs.transferCosts);
  const tenureMode = inputs.tenureMode || 'AUTO';
  const selectedStrategy = inputs.strategy || 'LOWER_EMI';

  // 1. Compute Base Loan Tenure & Feasibility
  const autoTenure = calculateTenureFromEmi(P, currRate, currEmi);
  const activeTenureMonths = (tenureMode === 'MANUAL' && inputs.manualTenureMonths && inputs.manualTenureMonths > 0)
    ? inputs.manualTenureMonths
    : (autoTenure.isFeasible ? autoTenure.months : 120);

  const currentTotalPayment = currEmi * activeTenureMonths;
  const currentRemainingInterest = Math.max(0, currentTotalPayment - P);

  // -------------------------------------------------------------
  // STRATEGY A: LOWER EMI (Keep Same Tenure: activeTenureMonths)
  // -------------------------------------------------------------
  const newEmiA = Math.round(calculateEmiFromTenure(P, propRate, activeTenureMonths));
  const emiRedA = Math.max(0, currEmi - newEmiA);
  const newTotalPayA = newEmiA * activeTenureMonths;
  const newTotalIntA = Math.max(0, newTotalPayA - P);
  const grossSaveA = Math.max(0, currentRemainingInterest - newTotalIntA);
  const netSaveA = grossSaveA - costs;
  const breakEvenA = emiRedA > 0 ? Number((costs / emiRedA).toFixed(1)) : 999;
  const isBeneficialA = netSaveA > 25000 && breakEvenA <= Math.min(36, activeTenureMonths);

  const pathA_LowerEmi: StrategyDetail = {
    newEmi: newEmiA,
    newTenureMonths: activeTenureMonths,
    monthlyEmiReduction: emiRedA,
    monthsSaved: 0,
    grossInterestSaving: grossSaveA,
    netSaving: netSaveA,
    breakEvenMonths: breakEvenA,
    newTotalPayment: newTotalPayA,
    newTotalInterest: newTotalIntA,
    isBeneficial: isBeneficialA
  };

  // -------------------------------------------------------------
  // STRATEGY B: FASTER DEBT FREEDOM (Maintain Current EMI)
  // -------------------------------------------------------------
  const tenureB = calculateTenureFromEmi(P, propRate, currEmi);
  const newTenureB = tenureB.isFeasible ? tenureB.months : activeTenureMonths;
  const monthsSavedB = Math.max(0, activeTenureMonths - newTenureB);
  const newTotalPayB = currEmi * newTenureB;
  const newTotalIntB = Math.max(0, newTotalPayB - P);
  const grossSaveB = Math.max(0, currentRemainingInterest - newTotalIntB);
  const netSaveB = grossSaveB - costs;
  const breakEvenB = Number((costs / (currEmi * (currRate - propRate) / 100 / 12 || 1)).toFixed(1));
  const isBeneficialB = netSaveB > 25000 && monthsSavedB >= 2;

  const pathB_FasterPayoff: StrategyDetail = {
    newEmi: currEmi,
    newTenureMonths: newTenureB,
    monthlyEmiReduction: 0,
    monthsSaved: monthsSavedB,
    grossInterestSaving: grossSaveB,
    netSaving: netSaveB,
    breakEvenMonths: Math.min(breakEvenB, 24),
    newTotalPayment: newTotalPayB,
    newTotalInterest: newTotalIntB,
    isBeneficial: isBeneficialB
  };

  // -------------------------------------------------------------
  // STRATEGY C: CASH FLOW RELIEF (Custom / Extended Tenure)
  // -------------------------------------------------------------
  const customMonths = inputs.customTenureMonths && inputs.customTenureMonths > 0
    ? inputs.customTenureMonths
    : Math.max(activeTenureMonths + 60, 180);
  const newEmiC = Math.round(calculateEmiFromTenure(P, propRate, customMonths));
  const emiRedC = currEmi - newEmiC;
  const newTotalPayC = newEmiC * customMonths;
  const newTotalIntC = Math.max(0, newTotalPayC - P);
  const grossSaveC = currentRemainingInterest - newTotalIntC;
  const netSaveC = grossSaveC - costs;
  const breakEvenC = emiRedC > 0 ? Number((costs / emiRedC).toFixed(1)) : 999;

  const pathC_Custom: StrategyDetail = {
    newEmi: newEmiC,
    newTenureMonths: customMonths,
    monthlyEmiReduction: emiRedC,
    monthsSaved: activeTenureMonths - customMonths, // negative if extended
    grossInterestSaving: grossSaveC,
    netSaving: netSaveC,
    breakEvenMonths: breakEvenC,
    newTotalPayment: newTotalPayC,
    newTotalInterest: newTotalIntC,
    isBeneficial: emiRedC > 0 && netSaveC > 0
  };

  // -------------------------------------------------------------
  // ACTIVE OUTCOME SELECTION
  // -------------------------------------------------------------
  let activeDetail: StrategyDetail;
  if (selectedStrategy === 'FASTER_PAYOFF') {
    activeDetail = pathB_FasterPayoff;
  } else if (selectedStrategy === 'CUSTOM_TENURE') {
    activeDetail = pathC_Custom;
  } else {
    activeDetail = pathA_LowerEmi;
  }

  // Fiduciary Decision & Wise Ant Commentary
  const isBeneficial = activeDetail.netSaving > 25000 && (activeDetail.breakEvenMonths <= 36 || activeDetail.monthsSaved >= 3);
  const decision: 'RECOMMEND_TRANSFER' | 'BORDERLINE' | 'NO_TRANSFER' =
    isBeneficial ? 'RECOMMEND_TRANSFER' : (activeDetail.netSaving > 0 ? 'BORDERLINE' : 'NO_TRANSFER');
  const decisionBadge =
    isBeneficial ? 'RECOMMENDED' : (activeDetail.netSaving > 0 ? 'BORDERLINE' : 'NOT ADVISABLE');

  let decisionText = '';
  let conclusionText = '';
  let wiseAntMessage = '';

  if (selectedStrategy === 'FASTER_PAYOFF') {
    decisionText = isBeneficial ? 'CLEARLY BENEFICIAL (FASTER FREEDOM)' : 'MARGINAL BENEFIT';
    conclusionText = `By maintaining your current ₹${currEmi.toLocaleString('en-IN')} EMI at ${propRate}%, your loan gets paid off ${activeDetail.monthsSaved} months (${(activeDetail.monthsSaved / 12).toFixed(1)} yrs) sooner, saving ₹${Math.round(activeDetail.netSaving).toLocaleString('en-IN')} net after ₹${costs.toLocaleString('en-IN')} transfer costs.`;
    wiseAntMessage = 'Same monthly budget, but your home becomes 100% debt-free months ahead of schedule. The purest wealth creation strategy!';
  } else if (selectedStrategy === 'LOWER_EMI') {
    decisionText = isBeneficial ? 'CLEARLY BENEFICIAL (MONTHLY SAVINGS)' : 'MARGINAL BENEFIT';
    conclusionText = `Transferring to ${propRate}% reduces monthly EMI by ₹${activeDetail.monthlyEmiReduction.toLocaleString('en-IN')} while keeping the exact remaining tenure of ${activeTenureMonths} months. Recovers all ₹${costs.toLocaleString('en-IN')} transfer costs in ${activeDetail.breakEvenMonths} months with ₹${Math.round(activeDetail.netSaving).toLocaleString('en-IN')} net savings.`;
    wiseAntMessage = 'A verified rate reduction with the same tenure creates genuine monthly cash surplus. Re-investing this EMI saving into a SIP multiplies your net worth exponentially!';
  } else {
    decisionText = activeDetail.netSaving > 0 ? 'CASH FLOW RELIEF' : 'HIGH LIFETIME INTEREST';
    conclusionText = `Setting tenure to ${customMonths} months drops your EMI to ₹${activeDetail.newEmi.toLocaleString('en-IN')}/mo (reducing outflow by ₹${activeDetail.monthlyEmiReduction.toLocaleString('en-IN')}/mo). Net interest impact: ₹${Math.round(activeDetail.netSaving).toLocaleString('en-IN')}.`;
    wiseAntMessage = activeDetail.netSaving < 0
      ? 'Warning: Stretching tenure provides immediate monthly relief, but increases lifetime interest outgo. Ensure this aligns with your cash flow objectives.'
      : 'Tenure adjusted to maximize monthly liquidity while maintaining overall positive financial economics.';
  }

  return {
    computedTenureMonths: autoTenure.months,
    computedTenureYears: autoTenure.years,
    computedTenureRemMonths: autoTenure.remMonths,
    isEmiFeasible: autoTenure.isFeasible,
    minRequiredEmi: autoTenure.minRequiredEmi,
    currentTotalPayment,
    currentRemainingInterest,
    activeRemainingTenure: activeTenureMonths,

    pathA_LowerEmi,
    pathB_FasterPayoff,
    pathC_Custom,

    selectedStrategy,
    newEmi: activeDetail.newEmi,
    newTenureMonths: activeDetail.newTenureMonths,
    monthlyEmiReduction: activeDetail.monthlyEmiReduction,
    monthsSaved: activeDetail.monthsSaved,
    grossInterestSaving: activeDetail.grossInterestSaving,
    netSaving: activeDetail.netSaving,
    breakEvenMonths: activeDetail.breakEvenMonths,
    newTotalPayment: activeDetail.newTotalPayment,
    newTotalInterest: activeDetail.newTotalInterest,
    isBeneficial,
    decision,
    decisionBadge,
    decisionText,
    conclusionText,
    wiseAntMessage
  };
}
