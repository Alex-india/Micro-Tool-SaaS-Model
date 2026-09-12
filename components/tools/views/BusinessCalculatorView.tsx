"use client";

import React, { useState, useMemo } from "react";
import { ToolMeta } from "@/lib/types";
import { ToolHeader } from "../ToolHeader";
import { Input } from "@/components/ui/Input";
import { ResultDisplay } from "../ResultDisplay";
import { SEOContent } from "../SEOContent";
import { RelatedTools } from "../RelatedTools";
import { formatCurrency } from "@/lib/utils";
import { ChartPanel } from "../ChartPanel";
import { TableDisplay } from "../TableDisplay";
import { DollarSign, TrendingUp, AlertTriangle, CheckCircle2, Briefcase, BarChart3, Users, Package } from "lucide-react";

export interface BusinessCalculatorViewProps {
  tool: ToolMeta;
}

export const BusinessCalculatorView: React.FC<BusinessCalculatorViewProps> = ({ tool }) => {
  const slug = tool.slug;

  // Mode detection
  const isCAC = slug.includes("cac") || slug.includes("ltv") || slug.includes("churn") || slug.includes("unit-economics");
  const isRunway = slug.includes("runway") || slug.includes("burn");
  const isBreakEven = slug.includes("breakeven") || slug.includes("break-even");
  const isROAS = slug.includes("roas");
  const isROI = slug.includes("roi");
  const isMRR = slug.includes("mrr") || slug.includes("arr") || slug.includes("revenue");
  const isCommission = slug.includes("commission");
  const isPayroll = slug.includes("payroll");
  const isInventory = slug.includes("inventory") || slug.includes("reorder");
  const isMarkup = slug.includes("markup");
  const isMargin = !isCAC && !isRunway && !isBreakEven && !isROAS && !isROI && !isMRR && !isCommission && !isPayroll && !isInventory && !isMarkup;

  // 1. Margin & Markup States
  const [costPrice, setCostPrice] = useState<string>("");
  const [sellingPrice, setSellingPrice] = useState<string>("");
  const [markupPercent, setMarkupPercent] = useState<string>("");

  // 2. CAC & LTV States
  const [marketingSpend, setMarketingSpend] = useState<string>("");
  const [customersAcquired, setCustomersAcquired] = useState<string>("");
  const [arpu, setArpu] = useState<string>("");
  const [grossMarginPercent, setGrossMarginPercent] = useState<string>("");
  const [monthlyChurnRate, setMonthlyChurnRate] = useState<string>("");

  // 3. Runway States
  const [cashBalance, setCashBalance] = useState<string>("");
  const [monthlyRevenue, setMonthlyRevenue] = useState<string>("");
  const [monthlyExpenses, setMonthlyExpenses] = useState<string>("");

  // 4. Break-Even States
  const [fixedCosts, setFixedCosts] = useState<string>("");
  const [unitSellingPrice, setUnitSellingPrice] = useState<string>("");
  const [unitVariableCost, setUnitVariableCost] = useState<string>("");

  // 5. ROAS States
  const [adSpend, setAdSpend] = useState<string>("");
  const [adRevenue, setAdRevenue] = useState<string>("");

  // 6. ROI States
  const [initialInvestment, setInitialInvestment] = useState<string>("");
  const [finalValue, setFinalValue] = useState<string>("");
  const [investmentYears, setInvestmentYears] = useState<number>(3);

  // 7. MRR / ARR States
  const [subscribers, setSubscribers] = useState<string>("");
  const [monthlyFee, setMonthlyFee] = useState<string>("");

  // 8. Commission States
  const [salesAmount, setSalesAmount] = useState<string>("");
  const [commissionRate, setCommissionRate] = useState<string>("");

  // 9. Payroll States
  const [employeeCount, setEmployeeCount] = useState<string>("");
  const [avgSalary, setAvgSalary] = useState<string>("");
  const [benefitsPercent, setBenefitsPercent] = useState<string>("");

  // 10. Inventory Reorder States
  const [dailyDemand, setDailyDemand] = useState<string>("");
  const [leadTimeDays, setLeadTimeDays] = useState<string>("");
  const [safetyStock, setSafetyStock] = useState<string>("");

  // Calculations
  const marginResult = useMemo(() => {
    const cost = Math.max(0, parseFloat(costPrice) || 0);
    const sell = Math.max(0, parseFloat(sellingPrice) || 0);
    const profit = sell - cost;
    const margin = sell > 0 ? (profit / sell) * 100 : 0;
    const markup = cost > 0 ? (profit / cost) * 100 : 0;

    const pricingScenarios = [0, 5, 10, 15, 20, 25].map((pct) => {
      const scenarioPrice = sell > 0 ? sell * (1 + pct / 100) : (cost > 0 ? cost * (1 + (pct || 20) / 100) : 0);
      const scenarioProfit = scenarioPrice - cost;
      const scenarioMargin = scenarioPrice > 0 ? (scenarioProfit / scenarioPrice) * 100 : 0;
      return {
        scenario: pct === 0 ? "Current Price" : `+${pct}% Price Increase`,
        price: formatCurrency(scenarioPrice),
        unitProfit: formatCurrency(scenarioProfit),
        margin: `${scenarioMargin.toFixed(1)}%`,
      };
    });

    return { profit, margin: margin.toFixed(2), markup: markup.toFixed(2), pricingScenarios };
  }, [costPrice, sellingPrice]);

  const markupResult = useMemo(() => {
    const cost = Math.max(0, parseFloat(costPrice) || 0);
    const markup = Math.max(0, parseFloat(markupPercent) || 0);
    const profit = (cost * markup) / 100;
    const sell = cost + profit;
    const margin = sell > 0 ? (profit / sell) * 100 : 0;

    const batchBreakdown = [10, 50, 100, 500].map((units) => ({
      units: `${units} Units`,
      totalCost: formatCurrency(cost * units),
      totalRevenue: formatCurrency(sell * units),
      totalProfit: formatCurrency(profit * units),
    }));

    return {
      sellingPrice: sell,
      profit,
      margin: margin.toFixed(2),
      markup: markup.toFixed(2),
      batchBreakdown,
    };
  }, [costPrice, markupPercent]);

  const cacResult = useMemo(() => {
    const spend = Math.max(0, parseFloat(marketingSpend) || 0);
    const count = Math.max(1, parseFloat(customersAcquired) || 1);
    const cac = spend / count;
    const churn = Math.max(0.1, parseFloat(monthlyChurnRate) || 3.5) / 100;
    const customerLifespanMonths = 1 / churn;
    const ltv = (parseFloat(arpu) || 0) * ((parseFloat(grossMarginPercent) || 80) / 100) * customerLifespanMonths;
    const ratio = cac > 0 ? ltv / cac : 0;

    let health = "Exceptional (4x+)";
    if (ratio < 1) health = "Dangerous (Burning Cash)";
    else if (ratio < 3) health = "Sub-optimal (<3x)";
    else if (ratio <= 5) health = "Ideal SaaS Benchmark (3x - 5x)";

    return {
      cac: Math.round(cac),
      ltv: Math.round(ltv),
      ratio: ratio.toFixed(2),
      customerLifespanMonths: customerLifespanMonths.toFixed(1),
      health,
    };
  }, [marketingSpend, customersAcquired, arpu, grossMarginPercent, monthlyChurnRate]);

  const runwayResult = useMemo(() => {
    const numExp = parseFloat(monthlyExpenses) || 0;
    const numRev = parseFloat(monthlyRevenue) || 0;
    const numCash = parseFloat(cashBalance) || 0;
    const netBurn = Math.max(0, numExp - numRev);
    const runwayMonths = netBurn > 0 ? numCash / netBurn : 999;
    const zeroCashDate = new Date();
    zeroCashDate.setMonth(zeroCashDate.getMonth() + Math.floor(runwayMonths));

    return {
      netBurn,
      runwayMonths: netBurn > 0 ? runwayMonths.toFixed(1) : "Profitable (Infinite)",
      zeroCashDate: netBurn > 0 ? zeroCashDate.toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "N/A",
      isProfitable: numRev >= numExp,
    };
  }, [cashBalance, monthlyRevenue, monthlyExpenses]);

  const breakEvenResult = useMemo(() => {
    const numFixed = parseFloat(fixedCosts) || 0;
    const numSell = parseFloat(unitSellingPrice) || 0;
    const numVar = parseFloat(unitVariableCost) || 0;
    const unitMargin = numSell - numVar;
    const isBreakEvenPossible = unitMargin > 0 && numSell > 0;
    const unitsNeeded = isBreakEvenPossible ? Math.ceil(numFixed / unitMargin) : 0;
    const revenueNeeded = isBreakEvenPossible ? unitsNeeded * numSell : 0;
    const cmRatio = numSell > 0 && unitMargin > 0 ? ((unitMargin / numSell) * 100).toFixed(1) : "0";

    const sensitivityData = isBreakEvenPossible && unitsNeeded > 0
      ? [0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((multiplier) => {
          const units = Math.round(unitsNeeded * multiplier);
          const rev = units * numSell;
          const totalCost = numFixed + units * numVar;
          const profit = rev - totalCost;
          return {
            level: `${Math.round(multiplier * 100)}% of BEP`,
            units: `${units.toLocaleString()} Units`,
            revenue: formatCurrency(rev),
            totalCost: formatCurrency(totalCost),
            profit: formatCurrency(profit),
          };
        })
      : [];

    return { unitsNeeded, revenueNeeded, unitMargin, cmRatio, isBreakEvenPossible, sensitivityData };
  }, [fixedCosts, unitSellingPrice, unitVariableCost]);

  const roasResult = useMemo(() => {
    const numSpend = parseFloat(adSpend) || 0;
    const numRev = parseFloat(adRevenue) || 0;
    const roas = numSpend > 0 ? (numRev / numSpend) * 100 : 0;
    const multiplier = numSpend > 0 ? (numRev / numSpend).toFixed(2) : "0";
    const netProfit = numRev - numSpend;
    return { roas: roas.toFixed(1), multiplier, netProfit };
  }, [adSpend, adRevenue]);

  const roiResult = useMemo(() => {
    const numInit = Math.max(0, parseFloat(initialInvestment) || 0);
    const numFinal = Math.max(0, parseFloat(finalValue) || 0);
    const gain = numFinal - numInit;
    const roi = numInit > 0 ? (gain / numInit) * 100 : 0;
    const years = Math.max(1, investmentYears || 1);
    const cagr = numInit > 0 && numFinal > 0 ? (Math.pow(numFinal / numInit, 1 / years) - 1) * 100 : 0;

    const yearlyBreakdown = [];
    if (numInit > 0 && numFinal > 0) {
      const annualRate = cagr / 100;
      for (let y = 1; y <= years; y++) {
        const valAtY = numInit * Math.pow(1 + annualRate, y);
        yearlyBreakdown.push({
          year: `Yr ${y}`,
          investedAmount: Math.round(numInit),
          gain: Math.round(Math.max(0, valAtY - numInit)),
          totalValue: Math.round(valAtY),
        });
      }
    }

    return { roi: roi.toFixed(2), cagr: cagr.toFixed(2), gain, years, yearlyBreakdown };
  }, [initialInvestment, finalValue, investmentYears]);

  const mrrResult = useMemo(() => {
    const numSubs = parseFloat(subscribers) || 0;
    const numFee = parseFloat(monthlyFee) || 0;
    const mrr = numSubs * numFee;
    const arr = mrr * 12;
    return { mrr, arr };
  }, [subscribers, monthlyFee]);

  const commissionResult = useMemo(() => {
    const numSales = parseFloat(salesAmount) || 0;
    const numRate = parseFloat(commissionRate) || 0;
    const comm = (numSales * numRate) / 100;
    const netToCompany = numSales - comm;
    return { comm, netToCompany };
  }, [salesAmount, commissionRate]);

  const payrollResult = useMemo(() => {
    const numEmp = parseFloat(employeeCount) || 0;
    const numSal = parseFloat(avgSalary) || 0;
    const numBen = parseFloat(benefitsPercent) || 0;
    const basePayroll = numEmp * numSal;
    const benefits = (basePayroll * numBen) / 100;
    const totalMonthly = basePayroll + benefits;
    const totalAnnual = totalMonthly * 12;
    return { totalMonthly, totalAnnual, basePayroll, benefits };
  }, [employeeCount, avgSalary, benefitsPercent]);

  const inventoryResult = useMemo(() => {
    const numDemand = parseFloat(dailyDemand) || 0;
    const numLead = parseFloat(leadTimeDays) || 0;
    const numSafety = parseFloat(safetyStock) || 0;
    const leadTimeDemand = numDemand * numLead;
    const reorderPoint = leadTimeDemand + numSafety;
    return { reorderPoint, leadTimeDemand };
  }, [dailyDemand, leadTimeDays, safetyStock]);

  return (
    <div className="w-full flex flex-col gap-6">
      <ToolHeader tool={tool} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Inputs */}
        <div className="lg:col-span-6 flex flex-col gap-6 bg-surface border border-border rounded-xl p-6 shadow-card">
          {isCAC ? (
            <>
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2.5">
                CAC & Lifetime Value Metrics
              </h3>
              <Input
                label="Monthly Sales & Marketing Budget"
                type="number"
                value={marketingSpend}
                onChange={(e) => setMarketingSpend(e.target.value)}
                prefixSymbol="₹"
                placeholder="Enter marketing budget (e.g. 150000)..."
              />
              <Input
                label="New Paying Customers Acquired"
                type="number"
                value={customersAcquired}
                onChange={(e) => setCustomersAcquired(e.target.value)}
                placeholder="Enter customers count (e.g. 300)..."
              />
              <Input
                label="Average Revenue Per Account / Month (ARPU)"
                type="number"
                value={arpu}
                onChange={(e) => setArpu(e.target.value)}
                prefixSymbol="₹"
                placeholder="Enter monthly ARPU (e.g. 1200)..."
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Gross Margin (%)"
                  type="number"
                  value={grossMarginPercent}
                  onChange={(e) => setGrossMarginPercent(e.target.value)}
                  suffixSymbol="%"
                  placeholder="80"
                />
                <Input
                  label="Monthly Churn Rate (%)"
                  type="number"
                  value={monthlyChurnRate}
                  onChange={(e) => setMonthlyChurnRate(e.target.value)}
                  suffixSymbol="%"
                  placeholder="3.5"
                />
              </div>
            </>
          ) : isRunway ? (
            <>
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2.5">
                Startup Runway & Burn Rate
              </h3>
              <Input
                label="Total Cash Balance in Bank"
                type="number"
                value={cashBalance}
                onChange={(e) => setCashBalance(e.target.value)}
                prefixSymbol="₹"
                placeholder="Enter cash reserves (e.g. 5000000)..."
              />
              <Input
                label="Total Monthly Expenses (Gross Burn)"
                type="number"
                value={monthlyExpenses}
                onChange={(e) => setMonthlyExpenses(e.target.value)}
                prefixSymbol="₹"
                placeholder="Enter monthly expenses (e.g. 900000)..."
              />
              <Input
                label="Total Monthly Cash Revenue"
                type="number"
                value={monthlyRevenue}
                onChange={(e) => setMonthlyRevenue(e.target.value)}
                prefixSymbol="₹"
                placeholder="Enter monthly revenue (e.g. 400000)..."
              />
            </>
          ) : isBreakEven ? (
            <>
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2.5">
                Break-Even Point Parameters
              </h3>
              <Input
                label="Total Fixed Costs per Month"
                type="number"
                value={fixedCosts}
                onChange={(e) => setFixedCosts(e.target.value)}
                prefixSymbol="₹"
                placeholder="Enter fixed costs (e.g. 200000)..."
              />
              <Input
                label="Unit Selling Price"
                type="number"
                value={unitSellingPrice}
                onChange={(e) => setUnitSellingPrice(e.target.value)}
                prefixSymbol="₹"
                placeholder="Enter unit selling price (e.g. 1500)..."
              />
              <Input
                label="Variable Cost per Unit"
                type="number"
                value={unitVariableCost}
                onChange={(e) => setUnitVariableCost(e.target.value)}
                prefixSymbol="₹"
                placeholder="Enter unit variable cost (e.g. 600)..."
              />
            </>
          ) : isROAS ? (
            <>
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2.5">
                Return on Ad Spend (ROAS)
              </h3>
              <Input
                label="Total Advertising Spend"
                type="number"
                value={adSpend}
                onChange={(e) => setAdSpend(e.target.value)}
                prefixSymbol="₹"
                placeholder="Enter ad spend (e.g. 50000)..."
              />
              <Input
                label="Total Revenue Generated from Ads"
                type="number"
                value={adRevenue}
                onChange={(e) => setAdRevenue(e.target.value)}
                prefixSymbol="₹"
                placeholder="Enter ad revenue (e.g. 240000)..."
              />
            </>
          ) : isROI ? (
            <>
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2.5">
                Return on Investment (ROI)
              </h3>
              <Input
                label="Initial Investment Amount"
                type="number"
                value={initialInvestment}
                onChange={(e) => setInitialInvestment(e.target.value)}
                prefixSymbol="₹"
                placeholder="Enter initial investment (e.g. 100000)..."
              />
              <Input
                label="Final Value / Total Returns"
                type="number"
                value={finalValue}
                onChange={(e) => setFinalValue(e.target.value)}
                prefixSymbol="₹"
                placeholder="Enter final returns value (e.g. 175000)..."
              />
              <Input
                label="Holding Duration (Years)"
                type="number"
                value={investmentYears.toString()}
                onChange={(e) => setInvestmentYears(Math.max(1, Number(e.target.value) || 1))}
                placeholder="3"
                helperText="Used to compute annualized CAGR return"
              />
            </>
          ) : isMRR ? (
            <>
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2.5">
                Recurring Revenue Projections
              </h3>
              <Input
                label="Active Paying Subscribers"
                type="number"
                value={subscribers}
                onChange={(e) => setSubscribers(e.target.value)}
                placeholder="Enter subscribers count (e.g. 450)..."
              />
              <Input
                label="Average Monthly Subscription Fee"
                type="number"
                value={monthlyFee}
                onChange={(e) => setMonthlyFee(e.target.value)}
                prefixSymbol="₹"
                placeholder="Enter monthly fee (e.g. 2999)..."
              />
            </>
          ) : isCommission ? (
            <>
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2.5">
                Sales Commission Calculator
              </h3>
              <Input
                label="Gross Sales Volume"
                type="number"
                value={salesAmount}
                onChange={(e) => setSalesAmount(e.target.value)}
                prefixSymbol="₹"
                placeholder="Enter sales amount (e.g. 850000)..."
              />
              <Input
                label="Commission Rate (%)"
                type="number"
                value={commissionRate}
                onChange={(e) => setCommissionRate(e.target.value)}
                suffixSymbol="%"
                placeholder="8.5"
              />
            </>
          ) : isPayroll ? (
            <>
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2.5">
                Team Payroll Estimator
              </h3>
              <Input
                label="Total Team Members"
                type="number"
                value={employeeCount}
                onChange={(e) => setEmployeeCount(e.target.value)}
                placeholder="Enter employee count (e.g. 12)..."
              />
              <Input
                label="Average Monthly Salary per Employee"
                type="number"
                value={avgSalary}
                onChange={(e) => setAvgSalary(e.target.value)}
                prefixSymbol="₹"
                placeholder="Enter average salary (e.g. 65000)..."
              />
              <Input
                label="Benefits & Employer Taxes (%)"
                type="number"
                value={benefitsPercent}
                onChange={(e) => setBenefitsPercent(e.target.value)}
                suffixSymbol="%"
                placeholder="15"
              />
            </>
          ) : isInventory ? (
            <>
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2.5">
                Inventory Reorder Point (ROP)
              </h3>
              <Input
                label="Average Daily Demand (Units/Day)"
                type="number"
                value={dailyDemand}
                onChange={(e) => setDailyDemand(e.target.value)}
                placeholder="Enter daily demand (e.g. 45)..."
              />
              <Input
                label="Supplier Lead Time (Days)"
                type="number"
                value={leadTimeDays}
                onChange={(e) => setLeadTimeDays(e.target.value)}
                placeholder="Enter lead time days (e.g. 14)..."
              />
              <Input
                label="Safety Stock Reserve (Units)"
                type="number"
                value={safetyStock}
                onChange={(e) => setSafetyStock(e.target.value)}
                placeholder="Enter safety stock reserve (e.g. 150)..."
              />
            </>
          ) : isMarkup ? (
            <>
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2.5">
                Markup Calculator Parameters
              </h3>
              <Input
                label="Cost Price of Item (COGS)"
                type="number"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                prefixSymbol="₹"
                placeholder="Enter cost price (e.g. 400)..."
              />
              <Input
                label="Target Markup Percentage (%)"
                type="number"
                value={markupPercent}
                onChange={(e) => setMarkupPercent(e.target.value)}
                suffixSymbol="%"
                placeholder="Enter desired markup (e.g. 50)..."
              />
            </>
          ) : (
            <>
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2.5">
                Profit Margin & Markup Parameters
              </h3>
              <Input
                label="Cost Price (COGS)"
                type="number"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                prefixSymbol="₹"
                placeholder="Enter cost price (e.g. 500)..."
              />
              <Input
                label="Selling Price / Revenue"
                type="number"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                prefixSymbol="₹"
                placeholder="Enter selling price (e.g. 850)..."
              />
            </>
          )}
        </div>

        {/* Right Output Panel */}
        <div className="lg:col-span-6 flex flex-col gap-6 sticky top-20">
          {isCAC ? (
            <ResultDisplay
              primaryMetric={{
                label: "LTV to CAC Ratio",
                value: `${cacResult.ratio}x`,
              }}
              secondaryMetrics={[
                { label: "Customer Acquisition Cost (CAC)", value: formatCurrency(cacResult.cac) },
                { label: "Customer Lifetime Value (LTV)", value: formatCurrency(cacResult.ltv) },
                { label: "Customer Lifespan", value: `${cacResult.customerLifespanMonths} Months` },
                { label: "Unit Economics Health", value: cacResult.health },
              ]}
            />
          ) : isRunway ? (
            <ResultDisplay
              primaryMetric={{
                label: "Estimated Runway",
                value: typeof runwayResult.runwayMonths === "string" ? runwayResult.runwayMonths : `${runwayResult.runwayMonths} Months`,
              }}
              secondaryMetrics={[
                { label: "Net Monthly Burn", value: formatCurrency(runwayResult.netBurn) },
                { label: "Zero Cash Date", value: runwayResult.zeroCashDate },
                { label: "Monthly Gross Revenue", value: formatCurrency(parseFloat(monthlyRevenue) || 0) },
                { label: "Monthly Gross Expenses", value: formatCurrency(parseFloat(monthlyExpenses) || 0) },
              ]}
            />
          ) : isBreakEven ? (
            <>
              <ResultDisplay
                primaryMetric={{
                  label: "Break-Even Units",
                  value: breakEvenResult.isBreakEvenPossible ? `${breakEvenResult.unitsNeeded.toLocaleString()} Units` : "N/A (Loss per Unit)",
                }}
                secondaryMetrics={[
                  { label: "Break-Even Revenue", value: formatCurrency(breakEvenResult.revenueNeeded) },
                  { label: "Unit Contribution Margin", value: formatCurrency(breakEvenResult.unitMargin) },
                  { label: "Contribution Margin Ratio", value: `${breakEvenResult.cmRatio}%` },
                  { label: "Fixed Monthly Costs", value: formatCurrency(parseFloat(fixedCosts) || 0) },
                ]}
              />

              {!breakEvenResult.isBreakEvenPossible && parseFloat(unitSellingPrice) > 0 && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-xs text-rose-400">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <span>Selling price must exceed variable cost to cover fixed costs and reach break-even.</span>
                </div>
              )}

              {breakEvenResult.sensitivityData.length > 0 && (
                <TableDisplay
                  title="Break-Even Production Volume & Profit/Loss"
                  columns={[
                    { key: "level", label: "Production Level", align: "left" as const },
                    { key: "units", label: "Volume", align: "center" as const },
                    { key: "revenue", label: "Total Revenue", align: "right" as const },
                    { key: "totalCost", label: "Total Cost", align: "right" as const },
                    { key: "profit", label: "Net Profit / (Loss)", align: "right" as const },
                  ]}
                  data={breakEvenResult.sensitivityData}
                />
              )}
            </>
          ) : isROAS ? (
            <ResultDisplay
              primaryMetric={{
                label: "Return on Ad Spend (ROAS)",
                value: `${roasResult.roas}% (${roasResult.multiplier}x)`,
              }}
              secondaryMetrics={[
                { label: "Total Ad Revenue", value: formatCurrency(parseFloat(adRevenue) || 0) },
                { label: "Total Ad Spend", value: formatCurrency(parseFloat(adSpend) || 0) },
                { label: "Net Ad Profit", value: formatCurrency(roasResult.netProfit) },
                { label: "Performance Rating", value: parseFloat(roasResult.multiplier) >= 3 ? "Highly Profitable" : "Sub-optimal" },
              ]}
            />
          ) : isROI ? (
            <>
              <ResultDisplay
                primaryMetric={{
                  label: "Total Return on Investment",
                  value: `${roiResult.roi}%`,
                }}
                secondaryMetrics={[
                  { label: "Net Capital Gain", value: formatCurrency(roiResult.gain) },
                  { label: "Annualized Return (CAGR)", value: `${roiResult.cagr}% / yr` },
                  { label: "Initial Investment", value: formatCurrency(parseFloat(initialInvestment) || 0) },
                  { label: "Final Portfolio Value", value: formatCurrency(parseFloat(finalValue) || 0) },
                ]}
              />

              {roiResult.yearlyBreakdown.length > 0 && (
                <>
                  <ChartPanel
                    title="ROI Wealth Growth Curve"
                    type="area"
                    data={roiResult.yearlyBreakdown}
                    xKey="year"
                    series={[
                      { key: "investedAmount", name: "Initial Principal", color: "#3B82F6" },
                      { key: "totalValue", name: "Portfolio Value", color: "#10B981" },
                    ]}
                  />

                  <TableDisplay
                    title="Annualized Investment Compounding Table"
                    columns={[
                      { key: "year", label: "Year", align: "center" as const },
                      { key: "investedAmount", label: "Principal (₹)", align: "right" as const, format: (v: number) => formatCurrency(v) },
                      { key: "gain", label: "Capital Gain (₹)", align: "right" as const, format: (v: number) => formatCurrency(v) },
                      { key: "totalValue", label: "Total Portfolio (₹)", align: "right" as const, format: (v: number) => formatCurrency(v) },
                    ]}
                    data={roiResult.yearlyBreakdown}
                  />
                </>
              )}
            </>
          ) : isMRR ? (
            <ResultDisplay
              primaryMetric={{
                label: "Monthly Recurring Revenue (MRR)",
                value: formatCurrency(mrrResult.mrr),
              }}
              secondaryMetrics={[
                { label: "Annual Run Rate (ARR)", value: formatCurrency(mrrResult.arr) },
                { label: "Subscribers", value: `${(parseFloat(subscribers) || 0).toLocaleString()} Users` },
                { label: "Average ARPU", value: formatCurrency(parseFloat(monthlyFee) || 0) },
                { label: "Daily Run Rate", value: formatCurrency(Math.round(mrrResult.mrr / 30)) },
              ]}
            />
          ) : isCommission ? (
            <ResultDisplay
              primaryMetric={{
                label: "Commission Earned",
                value: formatCurrency(commissionResult.comm),
              }}
              secondaryMetrics={[
                { label: "Gross Sales Volume", value: formatCurrency(parseFloat(salesAmount) || 0) },
                { label: "Commission Rate", value: `${commissionRate || 0}%` },
                { label: "Net Revenue to Company", value: formatCurrency(commissionResult.netToCompany) },
                { label: "Effective Payout", value: "Instant Calculation" },
              ]}
            />
          ) : isPayroll ? (
            <ResultDisplay
              primaryMetric={{
                label: "Total Monthly Payroll",
                value: formatCurrency(payrollResult.totalMonthly),
              }}
              secondaryMetrics={[
                { label: "Annualized Payroll", value: formatCurrency(payrollResult.totalAnnual) },
                { label: "Base Salaries", value: formatCurrency(payrollResult.basePayroll) },
                { label: "Benefits & Taxes", value: formatCurrency(payrollResult.benefits) },
                { label: "Total Headcount", value: `${employeeCount || 0} Team Members` },
              ]}
            />
          ) : isInventory ? (
            <ResultDisplay
              primaryMetric={{
                label: "Reorder Point (ROP)",
                value: `${inventoryResult.reorderPoint.toLocaleString()} Units`,
              }}
              secondaryMetrics={[
                { label: "Lead Time Demand", value: `${inventoryResult.leadTimeDemand.toLocaleString()} Units` },
                { label: "Safety Stock Buffer", value: `${(parseFloat(safetyStock) || 0).toLocaleString()} Units` },
                { label: "Daily Consumption", value: `${dailyDemand || 0} Units/Day` },
                { label: "Supplier Wait Time", value: `${leadTimeDays || 0} Days` },
              ]}
            />
          ) : isMarkup ? (
            <>
              <ResultDisplay
                primaryMetric={{
                  label: "Recommended Selling Price",
                  value: formatCurrency(markupResult.sellingPrice),
                }}
                secondaryMetrics={[
                  { label: "Profit per Unit", value: formatCurrency(markupResult.profit) },
                  { label: "Gross Margin", value: `${markupResult.margin}%` },
                  { label: "Applied Markup", value: `${markupResult.markup}%` },
                  { label: "Cost Price (COGS)", value: formatCurrency(parseFloat(costPrice) || 0) },
                ]}
              />

              <div className="p-4 rounded-xl bg-surface border border-border shadow-card flex flex-col gap-3">
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Batch Order Revenue & Profit Table
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {markupResult.batchBreakdown.map((b, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-surface-raised border border-border flex flex-col gap-0.5">
                      <span className="font-bold text-text-primary">{b.units}</span>
                      <span className="text-[11px] text-text-tertiary">Rev: {b.totalRevenue}</span>
                      <span className="text-[11px] font-mono font-bold text-emerald-400">Profit: {b.totalProfit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <ResultDisplay
                primaryMetric={{
                  label: "Gross Profit Margin",
                  value: `${marginResult.margin}%`,
                }}
                secondaryMetrics={[
                  { label: "Gross Markup", value: `${marginResult.markup}%` },
                  { label: "Net Profit per Unit", value: formatCurrency(marginResult.profit) },
                  { label: "Cost of Goods (COGS)", value: formatCurrency(parseFloat(costPrice) || 0) },
                  { label: "Selling Price", value: formatCurrency(parseFloat(sellingPrice) || 0) },
                ]}
              />

              {marginResult.pricingScenarios.length > 0 && (
                <TableDisplay
                  title="Pricing Strategy & Margin Sensitivity Table"
                  columns={[
                    { key: "scenario", label: "Pricing Scenario", align: "left" as const },
                    { key: "price", label: "Selling Price", align: "right" as const },
                    { key: "unitProfit", label: "Unit Profit", align: "right" as const },
                    { key: "margin", label: "Gross Margin", align: "right" as const },
                  ]}
                  data={marginResult.pricingScenarios}
                />
              )}
            </>
          )}
        </div>
      </div>

      <SEOContent tool={tool} />
      <RelatedTools slugs={tool.related} />
    </div>
  );
};
