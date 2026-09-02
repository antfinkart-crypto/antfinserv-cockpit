/**
 * ANTFINSERV Home Loan Balance Transfer Decision Engine
 * Directly migrated from ANTFINSERV_Home_Loan_Acquisition_Calculator_v2.xlsx
 */

export interface HomeLoanInputs {
  clientName: string;
  mobile: string;
  currentLender: string;
  outstandingPrincipal: number;
  currentRate: number; // in % e.g. 9.0
  remainingTenureMonths: number; // in months e.g. 180
  currentEmi: number;
  proposedRate: number; // in % e.g. 8.25
  transferCosts: number; // e.g. 25000
}

export interface HomeLoanResults {
  newEmi: number;
  newTotalPayment: number;
  newRemainingInterest: number;
  currentRemainingInterest: number;
  grossInterestSaving: number;
  netSaving: number;
  monthlyEmiReduction: number;
  breakEvenMonths: number;
  isBeneficial: boolean;
  decision: "RECOMMEND_TRANSFER" | "BORDERLINE" | "NO_TRANSFER";
  decisionBadge: string;
  decisionText: string;
  conclusionText: string;
  wiseAntMessage: string;
}

export function calculateHomeLoanBT(inputs: HomeLoanInputs): HomeLoanResults {
  const P = inputs.outstandingPrincipal;
  const n = inputs.remainingTenureMonths;
  const currEmi = inputs.currentEmi;
  const transferCosts = inputs.transferCosts;

  // Monthly proposed interest rate
  const r = (inputs.proposedRate / 100) / 12;

  // New EMI using standard amortization formula: P * r * (1+r)^n / ((1+r)^n - 1)
  let newEmi = 0;
  if (r > 0 && n > 0) {
    const factor = Math.pow(1 + r, n);
    newEmi = P * r * factor / (factor - 1);
  }

  const newTotalPayment = newEmi * n;
  const newRemainingInterest = newTotalPayment - P;
  const currentRemainingInterest = (currEmi * n) - P;

  const grossInterestSaving = currentRemainingInterest - newRemainingInterest;
  const netSaving = grossInterestSaving - transferCosts;
  const monthlyEmiReduction = currEmi - newEmi;

  const breakEvenMonths = monthlyEmiReduction > 0 ? (transferCosts / monthlyEmiReduction) : 999;
  const isBeneficial = netSaving > 50000 && breakEvenMonths <= Math.min(36, n);

  let decisionText = '';
  let conclusionText = '';
  let wiseAntMessage = '';

  if (isBeneficial) {
    decisionText = 'CLEARLY BENEFICIAL';
    conclusionText = `A balance transfer generates ₹${Math.round(netSaving).toLocaleString('en-IN')} net savings after recovering all transfer costs within ${Math.round(breakEvenMonths)} months.`;
    wiseAntMessage = 'The economics support moving. Ensure processing charges and documentation are confirmed in writing before issuing a cheque.';
  } else {
    decisionText = 'NOT BENEFICIAL ON CURRENT NUMBERS';
    conclusionText = 'On the numbers entered, a transfer does not create a clear financial benefit. The right advice is not to move the loan merely for the sake of moving it.';
    wiseAntMessage = 'A NO-TRANSFER result is not a failed lead; it is a trust event. Staying put is the disciplined financial choice.';
  }

    const decision: "RECOMMEND_TRANSFER" | "BORDERLINE" | "NO_TRANSFER" = isBeneficial ? 'RECOMMEND_TRANSFER' : (netSaving > 0 ? 'BORDERLINE' : 'NO_TRANSFER');
  const decisionBadge = isBeneficial ? 'RECOMMENDED' : (netSaving > 0 ? 'BORDERLINE' : 'NOT ADVISABLE');

  return {
    decision,
    decisionBadge,
    newEmi: Math.round(newEmi),
    newTotalPayment: Math.round(newTotalPayment),
    newRemainingInterest: Math.round(newRemainingInterest),
    currentRemainingInterest: Math.round(currentRemainingInterest),
    grossInterestSaving: Math.round(grossInterestSaving),
    netSaving: Math.round(netSaving),
    monthlyEmiReduction: Math.round(monthlyEmiReduction),
    breakEvenMonths: Number(breakEvenMonths.toFixed(1)),
    isBeneficial,
    decisionText,
    conclusionText,
    wiseAntMessage
  };
}
