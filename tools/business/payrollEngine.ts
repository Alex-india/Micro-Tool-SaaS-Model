// tools/business/payrollEngine.ts
// Production-grade Payroll Calculator engine

export type EmployeeType = "full_time" | "part_time" | "contractor" | "intern";
export type SalaryCycle = "monthly" | "annual";

export interface Employee {
  id: string;
  name: string;
  role: string;
  type: EmployeeType;
  grossSalary: number;       // monthly gross
  currency: string;
  pfPercent: number;         // employer PF/Social Security % (default 12)
  professionalTax: number;   // fixed monthly (India)
  healthInsurance: number;   // monthly premium employer pays
  equityMonthly: number;     // monthly ESOP cost
  variablePay: number;       // monthly expected variable/bonus
  wfhStipend: number;        // monthly WFH stipend
}

export interface EmployeePayrollResult {
  id: string;
  name: string;
  role: string;
  type: EmployeeType;
  grossSalary: number;
  employerPF: number;
  healthInsurance: number;
  professionalTax: number;
  equityMonthly: number;
  variablePay: number;
  wfhStipend: number;
  totalCTC: number;         // total cost to company monthly
  annualCTC: number;
  ctcPerDay: number;
  overheadPercent: number;  // (totalCTC - grossSalary) / grossSalary * 100
}

export interface PayrollSummary {
  employees: EmployeePayrollResult[];
  totalGrossSalary: number;
  totalEmployerPF: number;
  totalHealthInsurance: number;
  totalEquity: number;
  totalVariablePay: number;
  totalOtherBenefits: number;
  totalMonthlyCTC: number;
  totalAnnualCTC: number;
  avgCTCPerEmployee: number;
  avgOverheadPercent: number;
  headcount: number;
  headcountByType: Record<EmployeeType, number>;
  ctcByType: Record<EmployeeType, number>;
  payrollGrowthAt10Percent: number;  // projected monthly CTC with 10% headcount growth
  burnRateMonthly: number;
  burnRateAnnual: number;
}

export interface HeadcountPlan {
  currentHeadcount: number;
  targetHeadcount: number;
  avgCTCPerHead: number;
  additionalMonthlyCost: number;
  additionalAnnualCost: number;
  monthsToBreakEven: number;  // rough calc if rev per head given
  revenuePerHead: number;
}

export const PAYROLL_PRESETS: { name: string; employees: Employee[] }[] = [
  {
    name: "Early-Stage SaaS (10 people)",
    employees: [
      { id: "e1", name: "CTO",           role: "Engineering", type: "full_time", grossSalary: 250000, currency: "INR", pfPercent: 12, professionalTax: 200, healthInsurance: 5000, equityMonthly: 20000, variablePay: 0, wfhStipend: 2000 },
      { id: "e2", name: "Sr. Engineer",   role: "Engineering", type: "full_time", grossSalary: 150000, currency: "INR", pfPercent: 12, professionalTax: 200, healthInsurance: 4000, equityMonthly: 10000, variablePay: 0, wfhStipend: 2000 },
      { id: "e3", name: "PM",             role: "Product",     type: "full_time", grossSalary: 120000, currency: "INR", pfPercent: 12, professionalTax: 200, healthInsurance: 4000, equityMonthly: 8000,  variablePay: 0, wfhStipend: 2000 },
      { id: "e4", name: "AE",             role: "Sales",       type: "full_time", grossSalary: 80000,  currency: "INR", pfPercent: 12, professionalTax: 200, healthInsurance: 3000, equityMonthly: 5000,  variablePay: 20000, wfhStipend: 1500 },
      { id: "e5", name: "Designer",       role: "Design",      type: "full_time", grossSalary: 90000,  currency: "INR", pfPercent: 12, professionalTax: 200, healthInsurance: 3000, equityMonthly: 5000,  variablePay: 0, wfhStipend: 1500 },
    ],
  },
  {
    name: "US Startup (5 people)",
    employees: [
      { id: "e1", name: "CEO",            role: "Leadership",  type: "full_time", grossSalary: 15000, currency: "USD", pfPercent: 7.65, professionalTax: 0, healthInsurance: 800, equityMonthly: 5000, variablePay: 0, wfhStipend: 100 },
      { id: "e2", name: "Full Stack Dev", role: "Engineering", type: "full_time", grossSalary: 12000, currency: "USD", pfPercent: 7.65, professionalTax: 0, healthInsurance: 600, equityMonthly: 2000, variablePay: 0, wfhStipend: 100 },
      { id: "e3", name: "Sales Manager",  role: "Sales",       type: "full_time", grossSalary: 8000,  currency: "USD", pfPercent: 7.65, professionalTax: 0, healthInsurance: 500, equityMonthly: 1000, variablePay: 3000, wfhStipend: 100 },
    ],
  },
];

function n(v: number, d = 2): number {
  return Math.round(v * Math.pow(10, d)) / Math.pow(10, d);
}

export function calculateEmployeePayroll(emp: Employee): EmployeePayrollResult {
  const employerPF = n((emp.grossSalary * emp.pfPercent) / 100, 2);
  const totalCTC = n(
    emp.grossSalary + employerPF + emp.healthInsurance +
    emp.professionalTax + emp.equityMonthly + emp.variablePay + emp.wfhStipend,
    2
  );
  const overheadPercent = emp.grossSalary > 0 ? n(((totalCTC - emp.grossSalary) / emp.grossSalary) * 100, 1) : 0;

  return {
    id: emp.id, name: emp.name, role: emp.role, type: emp.type,
    grossSalary: emp.grossSalary,
    employerPF, healthInsurance: emp.healthInsurance,
    professionalTax: emp.professionalTax,
    equityMonthly: emp.equityMonthly,
    variablePay: emp.variablePay,
    wfhStipend: emp.wfhStipend,
    totalCTC,
    annualCTC: n(totalCTC * 12, 2),
    ctcPerDay: n(totalCTC / 22, 2),  // 22 working days
    overheadPercent,
  };
}

export function calculatePayrollSummary(employees: Employee[]): PayrollSummary {
  const results = employees.map(calculateEmployeePayroll);
  const totalGrossSalary = n(results.reduce((s, r) => s + r.grossSalary, 0), 2);
  const totalEmployerPF = n(results.reduce((s, r) => s + r.employerPF, 0), 2);
  const totalHealthInsurance = n(results.reduce((s, r) => s + r.healthInsurance, 0), 2);
  const totalEquity = n(results.reduce((s, r) => s + r.equityMonthly, 0), 2);
  const totalVariablePay = n(results.reduce((s, r) => s + r.variablePay, 0), 2);
  const totalOtherBenefits = n(results.reduce((s, r) => s + r.professionalTax + r.wfhStipend, 0), 2);
  const totalMonthlyCTC = n(results.reduce((s, r) => s + r.totalCTC, 0), 2);
  const avgCTCPerEmployee = results.length > 0 ? n(totalMonthlyCTC / results.length, 2) : 0;
  const avgOverheadPercent = results.length > 0 ? n(results.reduce((s, r) => s + r.overheadPercent, 0) / results.length, 1) : 0;

  const headcountByType = { full_time: 0, part_time: 0, contractor: 0, intern: 0 } as Record<EmployeeType, number>;
  const ctcByType = { full_time: 0, part_time: 0, contractor: 0, intern: 0 } as Record<EmployeeType, number>;
  results.forEach(r => {
    headcountByType[r.type]++;
    ctcByType[r.type] = n((ctcByType[r.type] ?? 0) + r.totalCTC, 2);
  });

  return {
    employees: results,
    totalGrossSalary, totalEmployerPF, totalHealthInsurance,
    totalEquity, totalVariablePay, totalOtherBenefits,
    totalMonthlyCTC, totalAnnualCTC: n(totalMonthlyCTC * 12, 2),
    avgCTCPerEmployee, avgOverheadPercent,
    headcount: results.length,
    headcountByType, ctcByType,
    payrollGrowthAt10Percent: n(totalMonthlyCTC * 1.1, 2),
    burnRateMonthly: totalMonthlyCTC,
    burnRateAnnual: n(totalMonthlyCTC * 12, 2),
  };
}

export function calculateHeadcountPlan(currentHeadcount: number, targetHeadcount: number, avgCTCPerHead: number, revenuePerHead: number): HeadcountPlan {
  const additionalHeads = Math.max(0, targetHeadcount - currentHeadcount);
  const additionalMonthlyCost = n(additionalHeads * avgCTCPerHead, 2);
  const additionalRevenue = n(additionalHeads * revenuePerHead, 2);
  const monthsToBreakEven = additionalRevenue > 0 ? Math.ceil(additionalMonthlyCost / additionalRevenue) : 999;
  return {
    currentHeadcount, targetHeadcount, avgCTCPerHead,
    additionalMonthlyCost,
    additionalAnnualCost: n(additionalMonthlyCost * 12, 2),
    monthsToBreakEven,
    revenuePerHead,
  };
}

export function fmtPayroll(v: number, currency = "INR"): string {
  const sym: Record<string, string> = { USD: "$", INR: "₹", EUR: "€", GBP: "£" };
  const s = sym[currency] ?? "₹";
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (currency === "INR") {
    if (abs >= 1e7) return `${sign}${s}${(abs / 1e7).toFixed(2)}Cr`;
    if (abs >= 1e5) return `${sign}${s}${(abs / 1e5).toFixed(2)}L`;
    if (abs >= 1000) return `${sign}${s}${(abs / 1000).toFixed(1)}K`;
  } else {
    if (abs >= 1e6) return `${sign}${s}${(abs / 1e6).toFixed(2)}M`;
    if (abs >= 1000) return `${sign}${s}${(abs / 1000).toFixed(1)}K`;
  }
  return `${sign}${s}${abs.toFixed(2)}`;
}