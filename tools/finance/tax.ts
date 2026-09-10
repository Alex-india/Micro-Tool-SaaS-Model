export interface TaxInput {
  financialYear: "FY 2024-25" | "FY 2025-26";
  annualIncome: number;
  section80CDeductions?: number; // max 150000 in Old Regime
  hraExemption?: number;
  otherDeductions?: number;
}

export interface TaxSlab {
  slab: string;
  rate: string;
  taxAmount: number;
}

export interface TaxRegimeResult {
  taxableIncome: number;
  basicTax: number;
  cess: number;
  totalTax: number;
  monthlyInHand: number;
  slabs: TaxSlab[];
}

export interface TaxOutput {
  oldRegime: TaxRegimeResult;
  newRegime: TaxRegimeResult;
  recommendedRegime: "Old Regime" | "New Regime";
  savingsAmount: number;
}

export function calculateIncomeTax(input: TaxInput): TaxOutput {
  const { annualIncome, section80CDeductions = 0, hraExemption = 0, otherDeductions = 0 } = input;

  const standardDeductionOld = 50000;
  const standardDeductionNew = 75000; // FY 24-25 / FY 25-26 budget update

  // OLD REGIME CALCULATIONS
  const totalOldDeductions = standardDeductionOld + Math.min(150000, section80CDeductions) + hraExemption + otherDeductions;
  const taxableIncomeOld = Math.max(0, annualIncome - totalOldDeductions);

  let taxOld = 0;
  const slabsOld: TaxSlab[] = [];

  if (taxableIncomeOld <= 250000) {
    slabsOld.push({ slab: "Up to ₹2.5L", rate: "0%", taxAmount: 0 });
  } else {
    slabsOld.push({ slab: "Up to ₹2.5L", rate: "0%", taxAmount: 0 });
    if (taxableIncomeOld > 250000) {
      const slabTax = (Math.min(taxableIncomeOld, 500000) - 250000) * 0.05;
      taxOld += slabTax;
      slabsOld.push({ slab: "₹2.5L - ₹5L", rate: "5%", taxAmount: Math.round(slabTax) });
    }
    if (taxableIncomeOld > 500000) {
      const slabTax = (Math.min(taxableIncomeOld, 1000000) - 500000) * 0.2;
      taxOld += slabTax;
      slabsOld.push({ slab: "₹5L - ₹10L", rate: "20%", taxAmount: Math.round(slabTax) });
    }
    if (taxableIncomeOld > 1000000) {
      const slabTax = (taxableIncomeOld - 1000000) * 0.3;
      taxOld += slabTax;
      slabsOld.push({ slab: "Above ₹10L", rate: "30%", taxAmount: Math.round(slabTax) });
    }
  }

  // Section 87A rebate for old regime (taxable income <= 5L)
  if (taxableIncomeOld <= 500000) {
    taxOld = 0;
  }

  const cessOld = taxOld * 0.04;
  const totalTaxOld = Math.round(taxOld + cessOld);
  const monthlyInHandOld = Math.round((annualIncome - totalTaxOld) / 12);

  // NEW REGIME CALCULATIONS
  const taxableIncomeNew = Math.max(0, annualIncome - standardDeductionNew);
  let taxNew = 0;
  const slabsNew: TaxSlab[] = [];

  slabsNew.push({ slab: "Up to ₹3L", rate: "0%", taxAmount: 0 });
  if (taxableIncomeNew > 300000) {
    const slabTax = (Math.min(taxableIncomeNew, 700000) - 300000) * 0.05;
    taxNew += slabTax;
    slabsNew.push({ slab: "₹3L - ₹7L", rate: "5%", taxAmount: Math.round(slabTax) });
  }
  if (taxableIncomeNew > 700000) {
    const slabTax = (Math.min(taxableIncomeNew, 1000000) - 700000) * 0.1;
    taxNew += slabTax;
    slabsNew.push({ slab: "₹7L - ₹10L", rate: "10%", taxAmount: Math.round(slabTax) });
  }
  if (taxableIncomeNew > 1000000) {
    const slabTax = (Math.min(taxableIncomeNew, 1200000) - 1000000) * 0.15;
    taxNew += slabTax;
    slabsNew.push({ slab: "₹10L - ₹12L", rate: "15%", taxAmount: Math.round(slabTax) });
  }
  if (taxableIncomeNew > 1200000) {
    const slabTax = (Math.min(taxableIncomeNew, 1500000) - 1200000) * 0.2;
    taxNew += slabTax;
    slabsNew.push({ slab: "₹12L - ₹15L", rate: "20%", taxAmount: Math.round(slabTax) });
  }
  if (taxableIncomeNew > 1500000) {
    const slabTax = (taxableIncomeNew - 1500000) * 0.3;
    taxNew += slabTax;
    slabsNew.push({ slab: "Above ₹15L", rate: "30%", taxAmount: Math.round(slabTax) });
  }

  // Section 87A rebate for new regime (taxable income <= 7L)
  if (taxableIncomeNew <= 700000) {
    taxNew = 0;
  }

  const cessNew = taxNew * 0.04;
  const totalTaxNew = Math.round(taxNew + cessNew);
  const monthlyInHandNew = Math.round((annualIncome - totalTaxNew) / 12);

  const recommendedRegime = totalTaxNew <= totalTaxOld ? "New Regime" : "Old Regime";
  const savingsAmount = Math.abs(totalTaxOld - totalTaxNew);

  return {
    oldRegime: {
      taxableIncome: Math.round(taxableIncomeOld),
      basicTax: Math.round(taxOld),
      cess: Math.round(cessOld),
      totalTax: totalTaxOld,
      monthlyInHand: monthlyInHandOld,
      slabs: slabsOld,
    },
    newRegime: {
      taxableIncome: Math.round(taxableIncomeNew),
      basicTax: Math.round(taxNew),
      cess: Math.round(cessNew),
      totalTax: totalTaxNew,
      monthlyInHand: monthlyInHandNew,
      slabs: slabsNew,
    },
    recommendedRegime,
    savingsAmount,
  };
}
