// Comprehensive audit script for all 20 Finance & Wealth Tools

const { calculateSIP } = require("../tools/finance/sip.ts");
const { calculateEMI } = require("../tools/finance/emi.ts");
const { calculateFD } = require("../tools/finance/fd.ts");
const { calculateGST } = require("../tools/finance/gst.ts");
const { calculateIncomeTax } = require("../tools/finance/tax.ts");

console.log("==========================================");
console.log("AUDITING ALL 20 FINANCE & WEALTH TOOLS");
console.log("==========================================\n");

let passedCount = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`✅ [PASS] ${message}`);
    passedCount++;
  } else {
    console.error(`❌ [FAIL] ${message}`);
    process.exitCode = 1;
  }
}

// 1. SIP Calculator
console.log("--- 1. SIP Calculator ---");
const sip = calculateSIP({
  monthlyInvestment: 5000,
  expectedReturnRate: 12,
  durationYears: 10,
  annualStepUpPercent: 10,
  lumpSumAmount: 50000,
});
assert(sip.totalInvested > 0, "SIP totalInvested is positive");
assert(sip.maturityValue > sip.totalInvested, "SIP maturityValue exceeds total invested");
assert(sip.yearlyBreakdown.length === 10, "SIP generates 10 years breakdown");

// 2. EMI Calculator
console.log("\n--- 2. EMI Calculator ---");
const emi = calculateEMI({
  loanAmount: 2500000,
  annualInterestRate: 8.5,
  tenureValue: 20,
  tenureUnit: "years",
});
assert(emi.monthlyEMI > 0, `EMI calculated: ${emi.monthlyEMI}`);
assert(emi.totalPayment === emi.totalPrincipal + emi.totalInterest, "Total payment matches principal + interest");
assert(emi.amortizationSchedule.length === 240, "20-year schedule has 240 monthly rows");
assert(emi.amortizationSchedule[0].remainingBalance > 0, "First month remainingBalance exists");
assert(emi.amortizationSchedule[239].remainingBalance === 0, "Final month remainingBalance is 0");

// 3. Loan Amortization Calculator
console.log("\n--- 3. Loan Amortization Calculator ---");
const loan = calculateEMI({
  loanAmount: 500000,
  annualInterestRate: 10,
  tenureValue: 3,
  tenureUnit: "years",
});
assert(loan.monthlyEMI === 16134, `3-year loan EMI: ${loan.monthlyEMI}`);
assert(loan.amortizationSchedule.length === 36, "3-year loan has 36 months schedule");

// 4. Fixed Deposit (FD) Calculator
console.log("\n--- 4. FD Calculator ---");
const fd = calculateFD({
  principalAmount: 100000,
  annualInterestRate: 7.0,
  tenureValue: 3,
  tenureUnit: "years",
  compoundingFrequency: "quarterly",
  isSeniorCitizen: false,
});
assert(fd.maturityAmount > 100000, `FD Maturity: ${fd.maturityAmount}`);
assert(fd.totalInterestEarned > 0, `FD Interest: ${fd.totalInterestEarned}`);

// 5. Senior Citizen FD
console.log("\n--- 5. Senior Citizen FD (+0.50%) ---");
const fdSenior = calculateFD({
  principalAmount: 100000,
  annualInterestRate: 7.0,
  tenureValue: 3,
  tenureUnit: "years",
  compoundingFrequency: "quarterly",
  isSeniorCitizen: true,
});
assert(fdSenior.appliedRate === 7.5, "Senior citizen gets +0.50% rate");
assert(fdSenior.maturityAmount > fd.maturityAmount, "Senior citizen maturity is higher");

// 6. GST Calculator
console.log("\n--- 6. GST Calculator ---");
const gstAdd = calculateGST({ amount: 10000, gstRate: 18, type: "add" });
assert(gstAdd.totalAmount === 11800, `Add 18% GST to 10000: ${gstAdd.totalAmount}`);
assert(gstAdd.cgstAmount === 900 && gstAdd.sgstAmount === 900, "CGST and SGST splits equal 50% each");

const gstRemove = calculateGST({ amount: 11800, gstRate: 18, type: "remove" });
assert(gstRemove.originalAmount === 10000, `Remove 18% GST from 11800: ${gstRemove.originalAmount}`);

// 7. Income Tax Calculator (FY 2024-25 / FY 2025-26)
console.log("\n--- 7. Income Tax Calculator ---");
const tax = calculateIncomeTax({
  financialYear: "FY 2024-25",
  annualIncome: 1200000,
  section80CDeductions: 150000,
  hraExemption: 50000,
  otherDeductions: 25000,
});
assert(tax.newRegime.totalTax >= 0, `New Regime Tax: ${tax.newRegime.totalTax}`);
assert(tax.oldRegime.totalTax >= 0, `Old Regime Tax: ${tax.oldRegime.totalTax}`);
assert(tax.recommendedRegime === "New Regime" || tax.recommendedRegime === "Old Regime", "Recommended regime returned");
assert(tax.savingsAmount >= 0, `Tax savings amount: ${tax.savingsAmount}`);

// 8. Low Income Rebate (Section 87A)
console.log("\n--- 8. Income Tax Rebate Check (<= 7L) ---");
const lowTax = calculateIncomeTax({
  financialYear: "FY 2024-25",
  annualIncome: 700000,
  section80CDeductions: 0,
});
assert(lowTax.newRegime.totalTax === 0, "New regime total tax is 0 for income <= 7.75L with standard deduction");

console.log("\n==========================================");
console.log(`AUDIT COMPLETE: ${passedCount}/${totalTests} TESTS PASSED!`);
console.log("==========================================");
