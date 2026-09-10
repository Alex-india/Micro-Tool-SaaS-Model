export interface FDInput {
  principalAmount: number;
  annualInterestRate: number;
  tenureValue: number;
  tenureUnit: "days" | "months" | "years";
  compoundingFrequency?: "quarterly" | "monthly" | "annually" | "simple";
  payoutOption?: "maturity" | "monthly" | "quarterly";
  isSeniorCitizen?: boolean;
}

export interface FDOutput {
  maturityAmount: number;
  totalInterestEarned: number;
  effectiveAnnualYield: number;
  payoutPerPeriod: number;
  appliedRate: number;
}

export function calculateFD(input: FDInput): FDOutput {
  const {
    principalAmount,
    annualInterestRate,
    tenureValue,
    tenureUnit,
    compoundingFrequency = "quarterly",
    payoutOption = "maturity",
    isSeniorCitizen = false,
  } = input;

  const appliedRate = annualInterestRate + (isSeniorCitizen ? 0.5 : 0);

  if (principalAmount <= 0 || tenureValue <= 0 || appliedRate <= 0) {
    return {
      maturityAmount: principalAmount,
      totalInterestEarned: 0,
      effectiveAnnualYield: 0,
      payoutPerPeriod: 0,
      appliedRate,
    };
  }

  // Convert tenure to years
  let years = tenureValue;
  if (tenureUnit === "days") years = tenureValue / 365;
  if (tenureUnit === "months") years = tenureValue / 12;

  let n = 4; // quarterly compounding by default
  if (compoundingFrequency === "monthly") n = 12;
  if (compoundingFrequency === "annually") n = 1;
  if (compoundingFrequency === "simple") n = 0;

  let maturityAmount = principalAmount;
  let totalInterest = 0;

  if (n === 0) {
    totalInterest = (principalAmount * appliedRate * years) / 100;
    maturityAmount = principalAmount + totalInterest;
  } else {
    maturityAmount = principalAmount * Math.pow(1 + appliedRate / (100 * n), n * years);
    totalInterest = maturityAmount - principalAmount;
  }

  const effectiveAnnualYield = parseFloat(((Math.pow(1 + totalInterest / principalAmount, 1 / years) - 1) * 100).toFixed(2));

  let payoutPerPeriod = 0;
  if (payoutOption === "monthly") {
    payoutPerPeriod = Math.round((principalAmount * (appliedRate / 100)) / 12);
  } else if (payoutOption === "quarterly") {
    payoutPerPeriod = Math.round((principalAmount * (appliedRate / 100)) / 4);
  }

  return {
    maturityAmount: Math.round(maturityAmount),
    totalInterestEarned: Math.round(totalInterest),
    effectiveAnnualYield: isNaN(effectiveAnnualYield) ? appliedRate : effectiveAnnualYield,
    payoutPerPeriod,
    appliedRate,
  };
}
