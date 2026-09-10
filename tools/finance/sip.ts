export interface SIPInput {
  monthlyInvestment: number;
  expectedReturnRate: number;
  durationYears: number;
  annualStepUpPercent?: number;
  lumpSumAmount?: number;
}

export interface SIPYearBreakdown {
  year: number;
  investedAmount: number;
  interestEarned: number;
  totalValue: number;
}

export interface SIPOutput {
  totalInvested: number;
  estimatedReturns: number;
  maturityValue: number;
  returnPercentage: number;
  effectiveCAGR: number;
  yearlyBreakdown: SIPYearBreakdown[];
}

export function calculateSIP(input: SIPInput): SIPOutput {
  const {
    monthlyInvestment,
    expectedReturnRate,
    durationYears,
    annualStepUpPercent = 0,
    lumpSumAmount = 0,
  } = input;

  const monthlyRate = expectedReturnRate / 12 / 100;
  const totalMonths = durationYears * 12;

  let currentMonthlyInv = monthlyInvestment;
  let totalInvested = lumpSumAmount;
  let currentBalance = lumpSumAmount;

  const yearlyBreakdown: SIPYearBreakdown[] = [];

  for (let month = 1; month <= totalMonths; month++) {
    // Apply annual step up at the start of each year after year 1
    if (month > 1 && (month - 1) % 12 === 0 && annualStepUpPercent > 0) {
      currentMonthlyInv = currentMonthlyInv * (1 + annualStepUpPercent / 100);
    }

    currentBalance = (currentBalance + currentMonthlyInv) * (1 + monthlyRate);
    totalInvested += currentMonthlyInv;

    if (month % 12 === 0) {
      const yearNum = month / 12;
      yearlyBreakdown.push({
        year: yearNum,
        investedAmount: Math.round(totalInvested),
        interestEarned: Math.round(Math.max(0, currentBalance - totalInvested)),
        totalValue: Math.round(currentBalance),
      });
    }
  }

  const maturityValue = Math.round(currentBalance);
  const estimatedReturns = Math.round(Math.max(0, maturityValue - totalInvested));
  const returnPercentage = totalInvested > 0 ? parseFloat(((estimatedReturns / totalInvested) * 100).toFixed(1)) : 0;
  const cagrRaw = (Math.pow(maturityValue / totalInvested, 1 / durationYears) - 1) * 100;
  const effectiveCAGR = durationYears > 0 && totalInvested > 0 ? parseFloat(cagrRaw.toFixed(1)) : 0;

  return {
    totalInvested: Math.round(totalInvested),
    estimatedReturns,
    maturityValue,
    returnPercentage,
    effectiveCAGR: Number(effectiveCAGR),
    yearlyBreakdown,
  };
}
