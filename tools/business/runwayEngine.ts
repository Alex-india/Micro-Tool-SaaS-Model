/**
 * Startup Burn Rate & Cash Runway Engine
 * 
 * Implements startup treasury, burn dynamics, and runway metrics:
 * - Gross vs Net Monthly Burn Rate
 * - Static Cash Runway (Months & Days) & Zero Cash Date
 * - Fundraising Alert Stages (Safe, Pitch Window, Danger Zone, Critical)
 * - Departmental Expense Categorization (Payroll, Cloud, Marketing, SaaS, G&A)
 * - Dynamic Forward Cash Simulation (Revenue Compounding vs Hiring Inflation)
 * - "What-If" Runway Extension Modeler (Survival Scenarios)
 */

export type CurrencyCode = "USD" | "EUR" | "GBP" | "INR" | "CAD" | "AUD" | "JPY" | "SGD" | "AED" | "CHF";

export interface CurrencyMeta {
  code: CurrencyCode;
  symbol: string;
  name: string;
}

export const SUPPORTED_CURRENCIES: Record<CurrencyCode, CurrencyMeta> = {
  USD: { code: "USD", symbol: "$", name: "US Dollar (USD)" },
  EUR: { code: "EUR", symbol: "€", name: "Euro (EUR)" },
  GBP: { code: "GBP", symbol: "£", name: "British Pound (GBP)" },
  INR: { code: "INR", symbol: "₹", name: "Indian Rupee (INR)" },
  CAD: { code: "CAD", symbol: "CA$", name: "Canadian Dollar (CAD)" },
  AUD: { code: "AUD", symbol: "AU$", name: "Australian Dollar (AUD)" },
  JPY: { code: "JPY", symbol: "¥", name: "Japanese Yen (JPY)" },
  SGD: { code: "SGD", symbol: "SG$", name: "Singapore Dollar (SGD)" },
  AED: { code: "AED", symbol: "AED", name: "UAE Dirham (AED)" },
  CHF: { code: "CHF", symbol: "CHF", name: "Swiss Franc (CHF)" },
};

export interface ExpenseBreakdown {
  payroll: number;
  cloudCompute: number;
  marketing: number;
  saasTools: number;
  officeGa: number;
}

export interface RunwayInputs {
  cashBalance: number;
  monthlyRevenue: number;
  grossBurn: number;
  expenses: ExpenseBreakdown;
}

export interface ExpenseCategorySummary {
  category: string;
  key: keyof ExpenseBreakdown;
  amount: number;
  percentage: number;
}

export interface RunwayOutputs {
  cashBalance: number;
  monthlyRevenue: number;
  grossBurn: number;
  netBurn: number;
  isProfitable: boolean;
  runwayMonths: number;
  runwayDays: number;
  zeroCashDate: string;
  status: "critical" | "danger" | "pitch-window" | "safe" | "profitable";
  statusLabel: string;
  statusDescription: string;
  burnMultiple: number;
  expenseBreakdownSummary: ExpenseCategorySummary[];
}

export interface DynamicSimulationInputs {
  cashBalance: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  monthlyRevenueGrowthRate: number; // e.g. 5%
  monthlyExpenseGrowthRate: number; // e.g. 2%
  maxMonths?: number;
}

export interface SimulationMonth {
  month: number;
  monthName: string;
  startCash: number;
  revenue: number;
  expenses: number;
  netBurn: number;
  endCash: number;
  status: "normal" | "profitable" | "out-of-cash" | "alert";
}

export interface DynamicSimulationOutputs {
  months: SimulationMonth[];
  survivedMonths: number;
  reachedProfitability: boolean;
  profitabilityMonth: number | null;
  zeroCashMonth: number | null;
}

export interface WhatIfScenario {
  id: string;
  name: string;
  actionDescription: string;
  revisedGrossBurn: number;
  revisedRevenue: number;
  revisedNetBurn: number;
  revisedRunwayMonths: number;
  monthsGained: number;
  newZeroCashDate: string;
}

export interface RunwayPreset {
  id: string;
  name: string;
  description: string;
  cashBalance: number;
  monthlyRevenue: number;
  expenses: ExpenseBreakdown;
  revenueGrowthRate: number;
  expenseGrowthRate: number;
}

/**
 * 1. Calculate Static Runway, Net Burn, Zero Cash Date, and Fundraising Alerts
 */
export function calculateRunwayMetrics(inputs: RunwayInputs): RunwayOutputs {
  const cashBalance = Math.max(0, inputs.cashBalance || 0);
  const monthlyRevenue = Math.max(0, inputs.monthlyRevenue || 0);

  // If itemized expenses are provided, calculate total; otherwise use grossBurn
  const itemizedTotal =
    (inputs.expenses?.payroll || 0) +
    (inputs.expenses?.cloudCompute || 0) +
    (inputs.expenses?.marketing || 0) +
    (inputs.expenses?.saasTools || 0) +
    (inputs.expenses?.officeGa || 0);

  const grossBurn = Math.max(0, itemizedTotal > 0 ? itemizedTotal : inputs.grossBurn || 0);
  const netBurn = Math.max(0, grossBurn - monthlyRevenue);
  const isProfitable = monthlyRevenue >= grossBurn && grossBurn > 0;

  let runwayMonths = 999;
  let runwayDays = 999 * 30;
  let zeroCashDate = "Infinite (Default Alive)";

  const now = new Date();

  if (!isProfitable) {
    if (netBurn > 0) {
      runwayMonths = Number((cashBalance / netBurn).toFixed(1));
      runwayDays = Math.round(runwayMonths * 30.417);

      const targetDate = new Date(now.getFullYear(), now.getMonth() + Math.floor(runwayMonths), now.getDate());
      zeroCashDate = targetDate.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    } else if (cashBalance === 0) {
      runwayMonths = 0;
      runwayDays = 0;
      zeroCashDate = "Immediate (Zero Cash)";
    }
  }

  // Status diagnosis according to venture fundraising timelines
  let status: RunwayOutputs["status"] = "safe";
  let statusLabel = "Safe Horizon";
  let statusDescription = "Healthy cash runway. Focus on core product and commercial execution.";

  if (isProfitable) {
    status = "profitable";
    statusLabel = "Default Alive (Profitable)";
    statusDescription = "Monthly revenue exceeds gross burn. The company is self-sustaining without external capital.";
  } else if (runwayMonths < 3.0) {
    status = "critical";
    statusLabel = "Critical / Emergency Zone";
    statusDescription = "Less than 3 months runway. Immediate emergency bridge, cost reduction, or restructuring required.";
  } else if (runwayMonths < 6.0) {
    status = "danger";
    statusLabel = "Danger Zone";
    statusDescription = "Between 3 and 6 months runway. Fast-track active financing rounds or prepare contingency cuts.";
  } else if (runwayMonths <= 9.0) {
    status = "pitch-window";
    statusLabel = "Active Fundraising Window";
    statusDescription = "Ideal window to pitch VCs/angels (6-9 months). Investor diligence typically takes 3-5 months.";
  } else {
    status = "safe";
    statusLabel = "Safe Horizon (>12 Months)";
    statusDescription = "Over 12 months runway. Runway is sufficient to hit decisive milestones before the next raise.";
  }

  // Burn multiple = Net Burn / Revenue (Bessemer metric for capital efficiency)
  const burnMultiple = monthlyRevenue > 0 ? Number((netBurn / monthlyRevenue).toFixed(2)) : netBurn > 0 ? 9.9 : 0;

  // Expense breakdown summary
  const expenseCategories: Array<{ name: string; key: keyof ExpenseBreakdown }> = [
    { name: "Payroll & Contractors", key: "payroll" },
    { name: "Cloud & Compute", key: "cloudCompute" },
    { name: "Sales & Marketing", key: "marketing" },
    { name: "Software & SaaS Tooling", key: "saasTools" },
    { name: "Office, Legal & G&A", key: "officeGa" },
  ];

  const expenseBreakdownSummary: ExpenseCategorySummary[] = expenseCategories.map((cat) => {
    const amount = Math.max(0, inputs.expenses?.[cat.key] || 0);
    const percentage = grossBurn > 0 ? Number(((amount / grossBurn) * 100).toFixed(1)) : 0;
    return {
      category: cat.name,
      key: cat.key,
      amount,
      percentage,
    };
  });

  return {
    cashBalance,
    monthlyRevenue,
    grossBurn,
    netBurn,
    isProfitable,
    runwayMonths,
    runwayDays,
    zeroCashDate,
    status,
    statusLabel,
    statusDescription,
    burnMultiple,
    expenseBreakdownSummary,
  };
}

/**
 * 2. Dynamic Forward Month-by-Month Cash Simulation
 */
export function simulateDynamicRunway(inputs: DynamicSimulationInputs): DynamicSimulationOutputs {
  const maxMonths = inputs.maxMonths || 24;
  const revGrowth = 1 + (inputs.monthlyRevenueGrowthRate || 0) / 100;
  const expGrowth = 1 + (inputs.monthlyExpenseGrowthRate || 0) / 100;

  let currentCash = Math.max(0, inputs.cashBalance || 0);
  let currentRev = Math.max(0, inputs.monthlyRevenue || 0);
  let currentExp = Math.max(0, inputs.monthlyExpenses || 0);

  const months: SimulationMonth[] = [];
  let reachedProfitability = false;
  let profitabilityMonth: number | null = null;
  let zeroCashMonth: number | null = null;

  const now = new Date();

  for (let i = 1; i <= maxMonths; i++) {
    const targetDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const monthName = targetDate.toLocaleDateString("en-US", { month: "short", year: "numeric" });

    const startCash = currentCash;
    const netBurn = currentExp - currentRev;
    const endCash = Math.max(0, startCash - netBurn);

    let status: SimulationMonth["status"] = "normal";

    if (currentRev >= currentExp) {
      status = "profitable";
      if (!reachedProfitability) {
        reachedProfitability = true;
        profitabilityMonth = i;
      }
    } else if (endCash <= 0) {
      status = "out-of-cash";
      if (zeroCashMonth === null) {
        zeroCashMonth = i;
      }
    } else if (endCash < currentExp * 3) {
      status = "alert";
    }

    months.push({
      month: i,
      monthName,
      startCash: Math.round(startCash),
      revenue: Math.round(currentRev),
      expenses: Math.round(currentExp),
      netBurn: Math.round(netBurn),
      endCash: Math.round(endCash),
      status,
    });

    if (endCash <= 0 && !reachedProfitability) {
      break;
    }

    currentCash = endCash;
    currentRev = Math.round(currentRev * revGrowth);
    currentExp = Math.round(currentExp * expGrowth);
  }

  const survivedMonths = zeroCashMonth !== null ? zeroCashMonth : reachedProfitability ? 999 : months.length;

  return {
    months,
    survivedMonths,
    reachedProfitability,
    profitabilityMonth,
    zeroCashMonth,
  };
}

/**
 * 3. Calculate "What-If" Survival Scenarios
 */
export function calculateWhatIfScenarios(
  cashBalance: number,
  monthlyRevenue: number,
  expenses: ExpenseBreakdown
): WhatIfScenario[] {
  const currentGross =
    (expenses.payroll || 0) +
    (expenses.cloudCompute || 0) +
    (expenses.marketing || 0) +
    (expenses.saasTools || 0) +
    (expenses.officeGa || 0);

  const baseNet = Math.max(0, currentGross - monthlyRevenue);
  const baseRunway = baseNet > 0 ? cashBalance / baseNet : 999;
  const now = new Date();

  const scenariosDef: Array<{
    id: string;
    name: string;
    actionDescription: string;
    calculate: () => { revisedGross: number; revisedRev: number };
  }> = [
    {
      id: "cut-marketing",
      name: "Cut Marketing Spend by 50%",
      actionDescription: "Halve paid advertising, agency retainers, and sponsorship budgets.",
      calculate: () => ({
        revisedGross: currentGross - (expenses.marketing || 0) * 0.5,
        revisedRev: monthlyRevenue,
      }),
    },
    {
      id: "hiring-freeze",
      name: "Immediate Headcount & Tooling Freeze",
      actionDescription: "Pause open requisitions, cancel non-essential SaaS seats, and pause travel.",
      calculate: () => ({
        revisedGross: currentGross - (expenses.saasTools || 0) * 0.25 - (expenses.officeGa || 0) * 0.15,
        revisedRev: monthlyRevenue,
      }),
    },
    {
      id: "rif-cut",
      name: "20% Payroll & Contractor Restructuring",
      actionDescription: "Downsize contractor hours and non-core staff by 20% to preserve treasury.",
      calculate: () => ({
        revisedGross: currentGross - (expenses.payroll || 0) * 0.2,
        revisedRev: monthlyRevenue,
      }),
    },
    {
      id: "rev-boost",
      name: "+20% Revenue Acceleration",
      actionDescription: "Close pending pipeline deals and convert customers to upfront annual billing.",
      calculate: () => ({
        revisedGross: currentGross,
        revisedRev: monthlyRevenue * 1.2,
      }),
    },
  ];

  return scenariosDef.map((s) => {
    const { revisedGross, revisedRev } = s.calculate();
    const revisedNetBurn = Math.max(0, revisedGross - revisedRev);
    let revisedRunwayMonths = 999;
    let monthsGained = 0;
    let newZeroCashDate = "Infinite (Default Alive)";

    if (revisedNetBurn > 0) {
      revisedRunwayMonths = Number((cashBalance / revisedNetBurn).toFixed(1));
      monthsGained = Number((revisedRunwayMonths - baseRunway).toFixed(1));

      const targetDate = new Date(
        now.getFullYear(),
        now.getMonth() + Math.floor(revisedRunwayMonths),
        now.getDate()
      );
      newZeroCashDate = targetDate.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    }

    return {
      id: s.id,
      name: s.name,
      actionDescription: s.actionDescription,
      revisedGrossBurn: Math.round(revisedGross),
      revisedRevenue: Math.round(revisedRev),
      revisedNetBurn: Math.round(revisedNetBurn),
      revisedRunwayMonths,
      monthsGained: Math.max(0, monthsGained),
      newZeroCashDate,
    };
  });
}

/**
 * 4. Format Currency Values
 */
export function formatRunwayCurrency(amount: number, currency: CurrencyCode = "USD"): string {
  const meta = SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES.USD;
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  let formatted = "";
  if (currency === "INR") {
    formatted = absAmount.toLocaleString("en-IN", { maximumFractionDigits: 0 });
  } else if (currency === "JPY") {
    formatted = absAmount.toLocaleString("ja-JP", { maximumFractionDigits: 0 });
  } else {
    formatted = absAmount.toLocaleString("en-US", { maximumFractionDigits: 0 });
  }

  return `${isNegative ? "-" : ""}${meta.symbol}${formatted}`;
}

/**
 * 5. Industry Presets
 */
export const RUNWAY_PRESETS: RunwayPreset[] = [
  {
    id: "pre-seed",
    name: "Pre-Seed / Bootstrap",
    description: "$150k treasury, lean team, $18.5k gross burn, $4.5k MRR -> ~10.7 months runway.",
    cashBalance: 150000,
    monthlyRevenue: 4500,
    expenses: {
      payroll: 12000,
      cloudCompute: 1200,
      marketing: 2500,
      saasTools: 800,
      officeGa: 2000,
    },
    revenueGrowthRate: 8.0,
    expenseGrowthRate: 2.0,
  },
  {
    id: "seed-stage",
    name: "Seed Stage (Post-Raise)",
    description: "$1.8M fresh seed funding, $115k gross burn, $25k MRR -> ~20 months runway.",
    cashBalance: 1800000,
    monthlyRevenue: 25000,
    expenses: {
      payroll: 75000,
      cloudCompute: 8500,
      marketing: 18000,
      saasTools: 4500,
      officeGa: 9000,
    },
    revenueGrowthRate: 6.0,
    expenseGrowthRate: 2.5,
  },
  {
    id: "series-a",
    name: "Series A Scaleup",
    description: "$6.5M growth funding, $420k gross burn, $140k MRR -> ~23.2 months runway.",
    cashBalance: 6500000,
    monthlyRevenue: 140000,
    expenses: {
      payroll: 280000,
      cloudCompute: 35000,
      marketing: 65000,
      saasTools: 18000,
      officeGa: 22000,
    },
    revenueGrowthRate: 7.0,
    expenseGrowthRate: 3.5,
  },
  {
    id: "danger-zone",
    name: "Danger Zone / Bridge Round",
    description: "$240k treasury remaining, $95k gross burn, $25k MRR -> 3.4 months runway (Board alert!).",
    cashBalance: 240000,
    monthlyRevenue: 25000,
    expenses: {
      payroll: 65000,
      cloudCompute: 6000,
      marketing: 14000,
      saasTools: 3500,
      officeGa: 6500,
    },
    revenueGrowthRate: 3.0,
    expenseGrowthRate: 1.0,
  },
  {
    id: "default-alive",
    name: "Default Alive / Near Break-Even",
    description: "$500k cash, $65k gross burn, $62k MRR -> $3k net burn (166+ months runway / default alive).",
    cashBalance: 500000,
    monthlyRevenue: 62000,
    expenses: {
      payroll: 42000,
      cloudCompute: 4500,
      marketing: 11000,
      saasTools: 2500,
      officeGa: 5000,
    },
    revenueGrowthRate: 5.0,
    expenseGrowthRate: 1.5,
  },
];
