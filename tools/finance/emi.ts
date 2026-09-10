export interface EMIInput {
  loanAmount: number;
  annualInterestRate: number;
  tenureValue: number;
  tenureUnit: "months" | "years";
}

export interface EMIAmortizationRow {
  period: number;
  emi: number;
  principalPaid: number;
  interestPaid: number;
  remainingBalance: number;
}

export interface EMIOutput {
  monthlyEMI: number;
  totalPrincipal: number;
  totalInterest: number;
  totalPayment: number;
  interestToPrincipalRatio: number;
  amortizationSchedule: EMIAmortizationRow[];
}

export function calculateEMI(input: EMIInput): EMIOutput {
  const { loanAmount, annualInterestRate, tenureValue, tenureUnit } = input;

  const totalMonths = tenureUnit === "years" ? tenureValue * 12 : tenureValue;
  const monthlyRate = annualInterestRate / 12 / 100;

  if (totalMonths <= 0 || loanAmount <= 0) {
    return {
      monthlyEMI: 0,
      totalPrincipal: 0,
      totalInterest: 0,
      totalPayment: 0,
      interestToPrincipalRatio: 0,
      amortizationSchedule: [],
    };
  }

  let emi = 0;
  if (monthlyRate === 0) {
    emi = loanAmount / totalMonths;
  } else {
    emi = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
  }

  const roundedEMI = Math.round(emi);
  let remainingBalance = loanAmount;
  let totalInterest = 0;
  const schedule: EMIAmortizationRow[] = [];

  for (let month = 1; month <= totalMonths; month++) {
    const interestForMonth = monthlyRate === 0 ? 0 : remainingBalance * monthlyRate;
    const principalForMonth = Math.min(remainingBalance, emi - interestForMonth);
    remainingBalance = Math.max(0, remainingBalance - principalForMonth);
    totalInterest += interestForMonth;

    schedule.push({
      period: month,
      emi: roundedEMI,
      principalPaid: Math.round(principalForMonth),
      interestPaid: Math.round(interestForMonth),
      remainingBalance: Math.round(remainingBalance),
    });
  }

  const roundedTotalInterest = Math.round(totalInterest);
  const totalPayment = loanAmount + roundedTotalInterest;
  const ratio = loanAmount > 0 ? parseFloat(((roundedTotalInterest / loanAmount) * 100).toFixed(1)) : 0;

  return {
    monthlyEMI: roundedEMI,
    totalPrincipal: loanAmount,
    totalInterest: roundedTotalInterest,
    totalPayment,
    interestToPrincipalRatio: ratio,
    amortizationSchedule: schedule,
  };
}
