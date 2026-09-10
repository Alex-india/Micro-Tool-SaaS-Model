"use client";

import React, { useState, useMemo } from "react";
import { ToolMeta } from "@/lib/types";
import { ToolHeader } from "../ToolHeader";
import { Input } from "@/components/ui/Input";
import { Slider } from "@/components/ui/Slider";
import { Tabs } from "@/components/ui/Tabs";
import { ResultDisplay } from "../ResultDisplay";
import { ChartPanel } from "../ChartPanel";
import { TableDisplay } from "../TableDisplay";
import { SEOContent } from "../SEOContent";
import { RelatedTools } from "../RelatedTools";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { RotateCcw, TrendingUp, TrendingDown, Target, CreditCard, ShieldCheck, Sun, PiggyBank, Percent, Calculator } from "lucide-react";

export interface InvestmentCalculatorViewProps {
  tool: ToolMeta;
}

export const InvestmentCalculatorView: React.FC<InvestmentCalculatorViewProps> = ({ tool }) => {
  const slug = tool.slug;

  // Tool Type Detection
  const isFD = slug === "fd-calculator";
  const isRD = slug === "rd-calculator";
  const isCompound = slug === "compound-interest-calculator";
  const isSimple = slug === "simple-interest-calculator";
  const isInflation = slug === "inflation-calculator";
  const isRetirement = slug === "retirement-calculator";
  const isSavingsGoal = slug === "savings-goal-calculator";
  const isDebtPayoff = slug === "debt-payoff-calculator";

  // 1. General Investment / FD / RD / Compound / Simple States
  const [principal, setPrincipal] = useState<string>("");
  const [interestRate, setInterestRate] = useState<number>(
    isFD ? 7.25 : isRD ? 7.0 : isSimple ? 6.5 : isCompound ? 11.5 : 8.0
  );
  const [durationYears, setDurationYears] = useState<number>(5);
  const [tenureUnit, setTenureUnit] = useState<"years" | "months" | "days">("years");
  const [tenureValue, setTenureValue] = useState<number>(5);
  const [compoundingFreq, setCompoundingFreq] = useState<number>(4); // 4 = Quarterly
  const [isSeniorCitizen, setIsSeniorCitizen] = useState<boolean>(false);
  const [fdPayoutOption, setFdPayoutOption] = useState<"maturity" | "monthly" | "quarterly">("maturity");
  const [monthlyContribution, setMonthlyContribution] = useState<string>("");

  // 2. Inflation Calculator States
  const [inflationRate, setInflationRate] = useState<number>(6.0);
  const [inflationYears, setInflationYears] = useState<number>(10);

  // 3. Retirement Calculator States
  const [currentAge, setCurrentAge] = useState<number>(30);
  const [retirementAge, setRetirementAge] = useState<number>(60);
  const [lifeExpectancy, setLifeExpectancy] = useState<number>(85);
  const [currentMonthlyExpense, setCurrentMonthlyExpense] = useState<string>("");
  const [expectedInflation, setExpectedInflation] = useState<number>(6.0);
  const [preRetirementReturn, setPreRetirementReturn] = useState<number>(12.0);
  const [postRetirementReturn, setPostRetirementReturn] = useState<number>(8.0);
  const [existingRetirementSavings, setExistingRetirementSavings] = useState<string>("");

  // 4. Savings Goal States
  const [targetGoalAmount, setTargetGoalAmount] = useState<string>("");
  const [goalYears, setGoalYears] = useState<number>(5);
  const [goalExpectedReturn, setGoalExpectedReturn] = useState<number>(12.0);
  const [startingSavings, setStartingSavings] = useState<string>("");

  // 5. Debt Payoff States
  const [debtAmount, setDebtAmount] = useState<string>("");
  const [debtInterestRate, setDebtInterestRate] = useState<number>(16.0);
  const [monthlyDebtPayment, setMonthlyDebtPayment] = useState<string>("");
  const [extraPayment, setExtraPayment] = useState<string>("");

  // Reset Handler
  const handleReset = () => {
    setPrincipal("");
    setInterestRate(isFD ? 7.25 : isRD ? 7.0 : isSimple ? 6.5 : isCompound ? 11.5 : 8.0);
    setDurationYears(5);
    setTenureValue(5);
    setTenureUnit("years");
    setCompoundingFreq(4);
    setIsSeniorCitizen(false);
    setFdPayoutOption("maturity");
    setMonthlyContribution("");
    setInflationRate(6.0);
    setInflationYears(10);
    setCurrentAge(30);
    setRetirementAge(60);
    setLifeExpectancy(85);
    setCurrentMonthlyExpense("");
    setExistingRetirementSavings("");
    setTargetGoalAmount("");
    setGoalYears(5);
    setGoalExpectedReturn(12.0);
    setStartingSavings("");
    setDebtAmount("");
    setDebtInterestRate(16.0);
    setMonthlyDebtPayment("");
    setExtraPayment("");
  };

  // Main Calculation Engine
  const calc = useMemo(() => {
    // --- 1. INFLATION CALCULATOR ---
    if (isInflation) {
      const p = Math.max(0, parseFloat(principal) || 0);
      const r = (inflationRate || 0) / 100;
      const t = Math.max(1, inflationYears || 1);

      const futureCost = p * Math.pow(1 + r, t);
      const purchasingPower = p / Math.pow(1 + r, t);
      const cumulativeInflationPercent = ((Math.pow(1 + r, t) - 1) * 100);

      const yearlyBreakdown = [];
      for (let y = 1; y <= t; y++) {
        const costAtY = p * Math.pow(1 + r, y);
        const powerAtY = p / Math.pow(1 + r, y);
        yearlyBreakdown.push({
          year: `Yr ${y}`,
          futureCost: Math.round(costAtY),
          purchasingPower: Math.round(powerAtY),
          inflationPercent: `${((Math.pow(1 + r, y) - 1) * 100).toFixed(1)}%`,
        });
      }

      return {
        type: "inflation",
        primaryValue: Math.round(futureCost),
        purchasingPower: Math.round(purchasingPower),
        cumulativeInflationPercent: cumulativeInflationPercent.toFixed(1),
        currentValue: p,
        yearlyBreakdown,
      };
    }

    // --- 2. RETIREMENT CALCULATOR ---
    if (isRetirement) {
      const exp = Math.max(0, parseFloat(currentMonthlyExpense) || 0);
      const existing = Math.max(0, parseFloat(existingRetirementSavings) || 0);
      const yearsToRetire = Math.max(1, retirementAge - currentAge);
      const yearsInRetirement = Math.max(1, lifeExpectancy - retirementAge);
      const inf = (expectedInflation || 6) / 100;
      const preRetRate = (preRetirementReturn || 12) / 100;
      const postRetRate = (postRetirementReturn || 8) / 100;

      // Monthly expenses at age of retirement
      const monthlyExpenseAtRetirement = exp * Math.pow(1 + inf, yearsToRetire);
      const annualExpenseAtRetirement = monthlyExpenseAtRetirement * 12;

      // Real rate of return post-retirement
      const realPostReturn = (1 + postRetRate) / (1 + inf) - 1;
      
      // Target corpus needed at retirement using annuity formula
      let targetCorpus = 0;
      if (realPostReturn === 0) {
        targetCorpus = annualExpenseAtRetirement * yearsInRetirement;
      } else {
        targetCorpus = annualExpenseAtRetirement * ((1 - Math.pow(1 + realPostReturn, -yearsInRetirement)) / realPostReturn);
      }

      // Growth of existing savings till retirement
      const futureExistingSavings = existing * Math.pow(1 + preRetRate, yearsToRetire);
      const shortfallCorpus = Math.max(0, targetCorpus - futureExistingSavings);

      // Monthly SIP needed to bridge shortfall
      const monthlyPreRate = preRetRate / 12;
      const totalMonthsPre = yearsToRetire * 12;
      let monthlySavingsNeeded = 0;
      if (monthlyPreRate > 0 && totalMonthsPre > 0 && shortfallCorpus > 0) {
        monthlySavingsNeeded = (shortfallCorpus * monthlyPreRate) / (Math.pow(1 + monthlyPreRate, totalMonthsPre) - 1);
      }

      const yearlyBreakdown = [];
      let accumulated = existing;
      for (let y = 1; y <= yearsToRetire; y++) {
        for (let m = 1; m <= 12; m++) {
          accumulated = (accumulated + monthlySavingsNeeded) * (1 + monthlyPreRate);
        }
        yearlyBreakdown.push({
          year: `Age ${currentAge + y}`,
          corpusAccumulated: Math.round(accumulated),
          targetCorpus: Math.round(targetCorpus),
        });
      }

      return {
        type: "retirement",
        targetCorpus: Math.round(targetCorpus),
        monthlySavingsNeeded: Math.round(monthlySavingsNeeded),
        monthlyExpenseAtRetirement: Math.round(monthlyExpenseAtRetirement),
        futureExistingSavings: Math.round(futureExistingSavings),
        yearsToRetire,
        yearsInRetirement,
        yearlyBreakdown,
      };
    }

    // --- 3. SAVINGS GOAL CALCULATOR ---
    if (isSavingsGoal) {
      const target = Math.max(0, parseFloat(targetGoalAmount) || 0);
      const existing = Math.max(0, parseFloat(startingSavings) || 0);
      const years = Math.max(1, goalYears || 1);
      const r = (goalExpectedReturn || 12) / 100;
      const monthlyRate = r / 12;
      const totalMonths = years * 12;

      // Future value of existing starting savings
      const existingFutureValue = existing * Math.pow(1 + monthlyRate, totalMonths);
      const remainingTarget = Math.max(0, target - existingFutureValue);

      // Required monthly contribution
      let monthlyDepositNeeded = 0;
      if (monthlyRate > 0 && totalMonths > 0 && remainingTarget > 0) {
        monthlyDepositNeeded = (remainingTarget * monthlyRate) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
      }

      const totalInvested = existing + (monthlyDepositNeeded * totalMonths);
      const totalReturns = Math.max(0, target - totalInvested);

      const yearlyBreakdown = [];
      let curBal = existing;
      let curInvested = existing;
      for (let y = 1; y <= years; y++) {
        for (let m = 1; m <= 12; m++) {
          curBal = (curBal + monthlyDepositNeeded) * (1 + monthlyRate);
          curInvested += monthlyDepositNeeded;
        }
        yearlyBreakdown.push({
          year: `Yr ${y}`,
          investedAmount: Math.round(curInvested),
          totalValue: Math.round(curBal),
          target: Math.round(target),
        });
      }

      return {
        type: "savings-goal",
        monthlyDepositNeeded: Math.round(monthlyDepositNeeded),
        targetGoal: Math.round(target),
        totalInvested: Math.round(totalInvested),
        totalReturns: Math.round(totalReturns),
        yearlyBreakdown,
      };
    }

    // --- 4. DEBT PAYOFF CALCULATOR ---
    if (isDebtPayoff) {
      const principalDebt = Math.max(0, parseFloat(debtAmount) || 0);
      const r = (debtInterestRate || 16) / 100 / 12;
      const basePayment = Math.max(0, parseFloat(monthlyDebtPayment) || 0);
      const extra = Math.max(0, parseFloat(extraPayment) || 0);
      const totalMonthlyPay = basePayment + extra;

      let months = 0;
      let balance = principalDebt;
      let totalInterestPaid = 0;
      const monthlySchedule = [];

      // Minimum payment threshold check
      const minInterest = principalDebt * r;
      const isPayoffPossible = totalMonthlyPay > minInterest;

      if (isPayoffPossible && principalDebt > 0 && totalMonthlyPay > 0) {
        while (balance > 0 && months < 360) {
          months++;
          const interestForMonth = balance * r;
          const principalPaid = Math.min(balance, totalMonthlyPay - interestForMonth);
          balance = Math.max(0, balance - principalPaid);
          totalInterestPaid += interestForMonth;

          if (months <= 60 || balance === 0 || months % 6 === 0) {
            monthlySchedule.push({
              period: `Mo ${months}`,
              monthlyPayment: Math.round(totalMonthlyPay),
              principalPaid: Math.round(principalPaid),
              interestPaid: Math.round(interestForMonth),
              remainingDebt: Math.round(balance),
            });
          }
        }
      }

      // Comparison without extra payment
      let monthsWithoutExtra = 0;
      let totalInterestWithoutExtra = 0;
      if (basePayment > minInterest && principalDebt > 0) {
        let bal = principalDebt;
        while (bal > 0 && monthsWithoutExtra < 360) {
          monthsWithoutExtra++;
          const intForM = bal * r;
          const prinPaid = Math.min(bal, basePayment - intForM);
          bal = Math.max(0, bal - prinPaid);
          totalInterestWithoutExtra += intForM;
        }
      }

      const interestSaved = Math.max(0, totalInterestWithoutExtra - totalInterestPaid);
      const timeSavedMonths = Math.max(0, monthsWithoutExtra - months);

      return {
        type: "debt-payoff",
        monthsToPayoff: months,
        yearsToPayoff: (months / 12).toFixed(1),
        totalInterestPaid: Math.round(totalInterestPaid),
        totalAmountPaid: Math.round(principalDebt + totalInterestPaid),
        interestSaved: Math.round(interestSaved),
        timeSavedMonths,
        isPayoffPossible,
        monthlySchedule,
      };
    }

    // --- 5. FIXED DEPOSIT (FD) CALCULATOR ---
    if (isFD) {
      const p = Math.max(0, parseFloat(principal) || 0);
      const effectiveRate = interestRate + (isSeniorCitizen ? 0.5 : 0);
      const r = effectiveRate / 100;
      
      let years = tenureValue;
      if (tenureUnit === "months") years = tenureValue / 12;
      if (tenureUnit === "days") years = tenureValue / 365;
      years = Math.max(0.01, years);

      const n = compoundingFreq === 0 ? 0 : compoundingFreq; // 4 = quarterly
      let maturity = p;
      let interestEarned = 0;

      if (n === 0) {
        interestEarned = p * r * years;
        maturity = p + interestEarned;
      } else {
        maturity = p * Math.pow(1 + r / n, n * years);
        interestEarned = maturity - p;
      }

      const apy = parseFloat(((Math.pow(1 + interestEarned / (p || 1), 1 / years) - 1) * 100).toFixed(2));

      // Periodic Payouts
      let periodicPayout = 0;
      if (fdPayoutOption === "monthly") {
        periodicPayout = Math.round((p * r) / 12);
      } else if (fdPayoutOption === "quarterly") {
        periodicPayout = Math.round((p * r) / 4);
      }

      const totalTenureYears = Math.max(1, Math.ceil(years));
      const yearlyBreakdown = [];
      for (let y = 1; y <= totalTenureYears; y++) {
        const yYears = Math.min(y, years);
        const yMaturity = n === 0 ? p + (p * r * yYears) : p * Math.pow(1 + r / n, n * yYears);
        yearlyBreakdown.push({
          year: `Yr ${y}`,
          investedAmount: Math.round(p),
          interestEarned: Math.round(yMaturity - p),
          totalValue: Math.round(yMaturity),
        });
      }

      return {
        type: "fd",
        maturity: Math.round(maturity),
        totalDeposit: Math.round(p),
        interestEarned: Math.round(interestEarned),
        appliedRate: effectiveRate,
        apy: isNaN(apy) ? effectiveRate : apy,
        periodicPayout,
        payoutOption: fdPayoutOption,
        yearlyBreakdown,
      };
    }

    // --- 6. RECURRING DEPOSIT (RD) CALCULATOR ---
    if (isRD) {
      const monthlyDep = Math.max(0, parseFloat(principal) || 0);
      const effectiveRate = interestRate + (isSeniorCitizen ? 0.5 : 0);
      const r = effectiveRate / 100;
      const totalMonths = tenureUnit === "years" ? tenureValue * 12 : tenureValue;
      const totalDeposit = monthlyDep * totalMonths;
      const n = 4; // Quarterly compounding for Indian bank RDs

      // Compound formula for RD
      let currentBalance = 0;
      for (let m = 1; m <= totalMonths; m++) {
        currentBalance += monthlyDep;
        currentBalance *= Math.pow(1 + r / n, (1 / 12) * n);
      }

      const maturity = Math.round(currentBalance);
      const interestEarned = Math.max(0, maturity - totalDeposit);

      const yearlyBreakdown = [];
      const totalYears = Math.max(1, Math.ceil(totalMonths / 12));
      for (let y = 1; y <= totalYears; y++) {
        const months = Math.min(y * 12, totalMonths);
        let yBal = 0;
        for (let m = 1; m <= months; m++) {
          yBal += monthlyDep;
          yBal *= Math.pow(1 + r / n, (1 / 12) * n);
        }
        yearlyBreakdown.push({
          year: `Yr ${y}`,
          investedAmount: Math.round(monthlyDep * months),
          interestEarned: Math.round(Math.max(0, yBal - monthlyDep * months)),
          totalValue: Math.round(yBal),
        });
      }

      return {
        type: "rd",
        maturity,
        totalDeposit: Math.round(totalDeposit),
        interestEarned: Math.round(interestEarned),
        appliedRate: effectiveRate,
        yearlyBreakdown,
      };
    }

    // --- 7. SIMPLE INTEREST CALCULATOR ---
    if (isSimple) {
      const p = Math.max(0, parseFloat(principal) || 0);
      const r = (interestRate || 0) / 100;
      
      let years = tenureValue;
      if (tenureUnit === "months") years = tenureValue / 12;
      if (tenureUnit === "days") years = tenureValue / 365;
      years = Math.max(0.01, years);

      const interestEarned = p * r * years;
      const maturity = p + interestEarned;
      const totalYears = Math.max(1, Math.ceil(years));

      const yearlyBreakdown = [];
      for (let y = 1; y <= totalYears; y++) {
        const yYears = Math.min(y, years);
        const yInterest = p * r * yYears;
        yearlyBreakdown.push({
          year: `Yr ${y}`,
          investedAmount: Math.round(p),
          interestEarned: Math.round(yInterest),
          totalValue: Math.round(p + yInterest),
        });
      }

      return {
        type: "simple",
        maturity: Math.round(maturity),
        totalDeposit: Math.round(p),
        interestEarned: Math.round(interestEarned),
        appliedRate: interestRate,
        yearlyBreakdown,
      };
    }

    // --- 8. COMPOUND INTEREST CALCULATOR (Default) ---
    const p = Math.max(0, parseFloat(principal) || 0);
    const monthlyAdd = Math.max(0, parseFloat(monthlyContribution) || 0);
    const r = (interestRate || 0) / 100;
    const t = Math.max(1, durationYears || 1);
    const n = Math.max(1, compoundingFreq);

    let currentBalance = p;
    let totalInvested = p;
    const yearlyBreakdown = [];

    for (let y = 1; y <= t; y++) {
      for (let m = 1; m <= 12; m++) {
        currentBalance = (currentBalance + monthlyAdd) * Math.pow(1 + r / n, n / 12);
        totalInvested += monthlyAdd;
      }
      yearlyBreakdown.push({
        year: `Yr ${y}`,
        investedAmount: Math.round(totalInvested),
        interestEarned: Math.round(Math.max(0, currentBalance - totalInvested)),
        totalValue: Math.round(currentBalance),
      });
    }

    const maturity = Math.round(currentBalance);
    const interestEarned = Math.max(0, maturity - totalInvested);
    const growthPercent = totalInvested > 0 ? ((interestEarned / totalInvested) * 100).toFixed(1) : "0";

    return {
      type: "compound",
      maturity,
      totalDeposit: Math.round(totalInvested),
      interestEarned: Math.round(interestEarned),
      growthPercent,
      yearlyBreakdown,
    };
  }, [
    slug,
    isFD,
    isRD,
    isCompound,
    isSimple,
    isInflation,
    isRetirement,
    isSavingsGoal,
    isDebtPayoff,
    principal,
    interestRate,
    durationYears,
    tenureValue,
    tenureUnit,
    compoundingFreq,
    isSeniorCitizen,
    fdPayoutOption,
    monthlyContribution,
    inflationRate,
    inflationYears,
    currentAge,
    retirementAge,
    lifeExpectancy,
    currentMonthlyExpense,
    expectedInflation,
    preRetirementReturn,
    postRetirementReturn,
    existingRetirementSavings,
    targetGoalAmount,
    goalYears,
    goalExpectedReturn,
    startingSavings,
    debtAmount,
    debtInterestRate,
    monthlyDebtPayment,
    extraPayment,
  ]);

  return (
    <div className="w-full flex flex-col gap-6">
      <ToolHeader tool={tool} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form Inputs */}
        <div className="lg:col-span-5 flex flex-col gap-6 bg-surface border border-border rounded-xl p-6 shadow-card">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
              {isInflation
                ? "Inflation Parameters"
                : isRetirement
                ? "Retirement Planning Inputs"
                : isSavingsGoal
                ? "Savings Goal Target"
                : isDebtPayoff
                ? "Debt Balance & Payoff Plan"
                : isFD
                ? "Fixed Deposit Parameters"
                : isRD
                ? "Recurring Deposit Parameters"
                : isSimple
                ? "Simple Interest Inputs"
                : "Investment Parameters"}
            </h3>
            <button
              onClick={handleReset}
              className="text-xs text-text-tertiary hover:text-accent flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          </div>

          {/* 1. INFLATION INPUTS */}
          {isInflation && (
            <>
              <Input
                label="Current Amount / Cost of Basket (₹)"
                type="number"
                value={principal}
                onChange={(e) => setPrincipal(e.target.value)}
                prefixSymbol="₹"
                placeholder="Enter current cost (e.g. 50000)..."
                helperText="Cost of goods, services, or lifestyle today"
              />
              <Slider
                label="Annual Inflation Rate (%)"
                min={1}
                max={20}
                step={0.1}
                value={inflationRate}
                unit="%"
                onChangeValue={(v) => setInflationRate(v)}
              />
              <Slider
                label="Time Horizon (Years)"
                min={1}
                max={40}
                step={1}
                value={inflationYears}
                unit="years"
                onChangeValue={(v) => setInflationYears(v)}
              />
            </>
          )}

          {/* 2. RETIREMENT INPUTS */}
          {isRetirement && (
            <>
              <div className="grid grid-cols-3 gap-3">
                <Input
                  label="Current Age"
                  type="number"
                  value={currentAge.toString()}
                  onChange={(e) => setCurrentAge(Math.max(18, Number(e.target.value) || 18))}
                  placeholder="30"
                />
                <Input
                  label="Retire Age"
                  type="number"
                  value={retirementAge.toString()}
                  onChange={(e) => setRetirementAge(Math.max(currentAge + 1, Number(e.target.value) || 60))}
                  placeholder="60"
                />
                <Input
                  label="Life Expectancy"
                  type="number"
                  value={lifeExpectancy.toString()}
                  onChange={(e) => setLifeExpectancy(Math.max(retirementAge + 1, Number(e.target.value) || 85))}
                  placeholder="85"
                />
              </div>

              <Input
                label="Current Monthly Living Expenses (₹)"
                type="number"
                value={currentMonthlyExpense}
                onChange={(e) => setCurrentMonthlyExpense(e.target.value)}
                prefixSymbol="₹"
                placeholder="Enter monthly living expense (e.g. 60000)..."
                helperText="Your monthly expenses at today's cost"
              />

              <Input
                label="Existing Retirement Savings / EPF (₹)"
                type="number"
                value={existingRetirementSavings}
                onChange={(e) => setExistingRetirementSavings(e.target.value)}
                prefixSymbol="₹"
                placeholder="Enter existing savings (e.g. 500000)..."
                helperText="Current accumulated retirement savings"
              />

              <Slider
                label="Expected Inflation Rate (%)"
                min={3}
                max={12}
                step={0.5}
                value={expectedInflation}
                unit="%"
                onChangeValue={(v) => setExpectedInflation(v)}
              />

              <Slider
                label="Pre-Retirement Investment Return (%)"
                min={6}
                max={18}
                step={0.5}
                value={preRetirementReturn}
                unit="%"
                onChangeValue={(v) => setPreRetirementReturn(v)}
              />

              <Slider
                label="Post-Retirement Portfolio Return (%)"
                min={4}
                max={12}
                step={0.5}
                value={postRetirementReturn}
                unit="%"
                onChangeValue={(v) => setPostRetirementReturn(v)}
              />
            </>
          )}

          {/* 3. SAVINGS GOAL INPUTS */}
          {isSavingsGoal && (
            <>
              <Input
                label="Target Goal Amount (₹)"
                type="number"
                value={targetGoalAmount}
                onChange={(e) => setTargetGoalAmount(e.target.value)}
                prefixSymbol="₹"
                placeholder="Enter target goal amount (e.g. 2500000)..."
                helperText="e.g. House down-payment, car, education"
              />
              <Input
                label="Starting Capital Already Saved (₹) — Optional"
                type="number"
                value={startingSavings}
                onChange={(e) => setStartingSavings(e.target.value)}
                prefixSymbol="₹"
                placeholder="0"
              />
              <Slider
                label="Timeline to Reach Goal (Years)"
                min={1}
                max={30}
                step={1}
                value={goalYears}
                unit="years"
                onChangeValue={(v) => setGoalYears(v)}
              />
              <Slider
                label="Expected Annual Return (%)"
                min={1}
                max={25}
                step={0.5}
                value={goalExpectedReturn}
                unit="%"
                onChangeValue={(v) => setGoalExpectedReturn(v)}
              />
            </>
          )}

          {/* 4. DEBT PAYOFF INPUTS */}
          {isDebtPayoff && (
            <>
              <Input
                label="Total Outstanding Debt Balance (₹)"
                type="number"
                value={debtAmount}
                onChange={(e) => setDebtAmount(e.target.value)}
                prefixSymbol="₹"
                placeholder="Enter total debt (e.g. 500000)..."
                helperText="Credit card balances, personal loans, etc."
              />
              <Slider
                label="Annual Interest Rate (APR %)"
                min={1}
                max={40}
                step={0.5}
                value={debtInterestRate}
                unit="%"
                onChangeValue={(v) => setDebtInterestRate(v)}
              />
              <Input
                label="Monthly Payment Budget (₹)"
                type="number"
                value={monthlyDebtPayment}
                onChange={(e) => setMonthlyDebtPayment(e.target.value)}
                prefixSymbol="₹"
                placeholder="Enter monthly payment (e.g. 15000)..."
              />
              <Input
                label="Extra Monthly Payment (₹) — Optional"
                type="number"
                value={extraPayment}
                onChange={(e) => setExtraPayment(e.target.value)}
                prefixSymbol="₹"
                placeholder="0"
                helperText="Accelerate debt freedom with extra monthly funds"
              />
            </>
          )}

          {/* 5. FD INPUTS */}
          {isFD && (
            <>
              <Input
                label="Fixed Deposit Amount (₹)"
                type="number"
                value={principal}
                onChange={(e) => setPrincipal(e.target.value)}
                prefixSymbol="₹"
                placeholder="Enter FD amount (e.g. 500000)..."
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary">Tenure Unit</label>
                <Tabs
                  tabs={[
                    { id: "years", label: "Years" },
                    { id: "months", label: "Months" },
                    { id: "days", label: "Days" },
                  ]}
                  activeTab={tenureUnit}
                  onChange={(id) => setTenureUnit(id as any)}
                />
              </div>

              <Input
                label={`Tenure Duration (${tenureUnit})`}
                type="number"
                value={tenureValue.toString()}
                onChange={(e) => setTenureValue(Math.max(1, Number(e.target.value) || 1))}
              />

              <Slider
                label="Annual Interest Rate (%)"
                min={1}
                max={15}
                step={0.1}
                value={interestRate}
                unit="%"
                onChangeValue={(v) => setInterestRate(v)}
              />

              <div className="flex items-center justify-between p-3 rounded-lg bg-surface-raised border border-border">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-text-primary">Senior Citizen (+0.50% Rate)</span>
                  <span className="text-[11px] text-text-tertiary">Special preferential rates for age 60+</span>
                </div>
                <input
                  type="checkbox"
                  checked={isSeniorCitizen}
                  onChange={(e) => setIsSeniorCitizen(e.target.checked)}
                  className="w-4 h-4 accent-accent rounded cursor-pointer"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary">Interest Payout Preference</label>
                <select
                  value={fdPayoutOption}
                  onChange={(e) => setFdPayoutOption(e.target.value as any)}
                  className="bg-surface-raised border border-border rounded-lg p-2.5 text-xs text-text-primary outline-none focus:border-accent"
                >
                  <option value="maturity">Cumulative (Reinvestment at Maturity)</option>
                  <option value="monthly">Monthly Interest Payout</option>
                  <option value="quarterly">Quarterly Interest Payout</option>
                </select>
              </div>
            </>
          )}

          {/* 6. RD INPUTS */}
          {isRD && (
            <>
              <Input
                label="Monthly Deposit Amount (₹)"
                type="number"
                value={principal}
                onChange={(e) => setPrincipal(e.target.value)}
                prefixSymbol="₹"
                placeholder="Enter monthly deposit (e.g. 5000)..."
              />

              <Slider
                label="Tenure / Duration (Years)"
                min={1}
                max={10}
                step={1}
                value={tenureValue}
                unit="years"
                onChangeValue={(v) => setTenureValue(v)}
              />

              <Slider
                label="Annual Interest Rate (%)"
                min={1}
                max={15}
                step={0.1}
                value={interestRate}
                unit="%"
                onChangeValue={(v) => setInterestRate(v)}
              />

              <div className="flex items-center justify-between p-3 rounded-lg bg-surface-raised border border-border">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-text-primary">Senior Citizen (+0.50% Rate)</span>
                  <span className="text-[11px] text-text-tertiary">Applicable for individuals aged 60+</span>
                </div>
                <input
                  type="checkbox"
                  checked={isSeniorCitizen}
                  onChange={(e) => setIsSeniorCitizen(e.target.checked)}
                  className="w-4 h-4 accent-accent rounded cursor-pointer"
                />
              </div>
            </>
          )}

          {/* 7. SIMPLE INTEREST INPUTS */}
          {isSimple && (
            <>
              <Input
                label="Principal Amount (₹)"
                type="number"
                value={principal}
                onChange={(e) => setPrincipal(e.target.value)}
                prefixSymbol="₹"
                placeholder="Enter principal (e.g. 100000)..."
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary">Tenure Unit</label>
                <Tabs
                  tabs={[
                    { id: "years", label: "Years" },
                    { id: "months", label: "Months" },
                  ]}
                  activeTab={tenureUnit}
                  onChange={(id) => setTenureUnit(id as any)}
                />
              </div>

              <Input
                label={`Tenure Duration (${tenureUnit})`}
                type="number"
                value={tenureValue.toString()}
                onChange={(e) => setTenureValue(Math.max(1, Number(e.target.value) || 1))}
              />

              <Slider
                label="Annual Interest Rate (%)"
                min={1}
                max={30}
                step={0.1}
                value={interestRate}
                unit="%"
                onChangeValue={(v) => setInterestRate(v)}
              />
            </>
          )}

          {/* 8. COMPOUND INTEREST (DEFAULT) INPUTS */}
          {isCompound && (
            <>
              <Input
                label="Initial Principal Amount (₹)"
                type="number"
                value={principal}
                onChange={(e) => setPrincipal(e.target.value)}
                prefixSymbol="₹"
                placeholder="Enter principal (e.g. 100000)..."
              />

              <Slider
                label="Annual Interest Rate (%)"
                min={1}
                max={30}
                step={0.1}
                value={interestRate}
                unit="%"
                onChangeValue={(v) => setInterestRate(v)}
              />

              <Slider
                label="Duration (Years)"
                min={1}
                max={35}
                step={1}
                value={durationYears}
                unit="years"
                onChangeValue={(v) => setDurationYears(v)}
              />

              <div className="flex flex-col gap-1.5 text-xs">
                <label className="font-semibold text-text-secondary">Compounding Frequency</label>
                <select
                  value={compoundingFreq}
                  onChange={(e) => setCompoundingFreq(Number(e.target.value))}
                  className="bg-surface-raised border border-border rounded-lg p-2.5 text-xs text-text-primary outline-none focus:border-accent"
                >
                  <option value={1}>Annually (1x / year)</option>
                  <option value={2}>Semi-Annually (2x / year)</option>
                  <option value={4}>Quarterly (4x / year)</option>
                  <option value={12}>Monthly (12x / year)</option>
                </select>
              </div>

              <Input
                label="Monthly Additional Contribution (₹) — Optional"
                type="number"
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(e.target.value)}
                prefixSymbol="₹"
                placeholder="0"
                helperText="Add ongoing monthly contributions"
              />
            </>
          )}
        </div>

        {/* Right Output Results Panel */}
        <div className="lg:col-span-7 flex flex-col gap-6 sticky top-20">
          {/* 1. INFLATION RESULTS */}
          {calc.type === "inflation" && (
            <>
              <ResultDisplay
                primaryMetric={{
                  label: `Future Cost in ${inflationYears} Years`,
                  value: formatCurrency(calc.primaryValue || 0),
                }}
                secondaryMetrics={[
                  { label: "Today's Purchasing Power", value: formatCurrency(calc.currentValue || 0) },
                  { label: `Future Value of Today's ${formatCurrency(calc.currentValue || 0)}`, value: formatCurrency(calc.purchasingPower || 0) },
                  { label: "Cumulative Inflation Rise", value: `+${calc.cumulativeInflationPercent}%` },
                  { label: "Purchasing Power Lost", value: `-${(100 - ((calc.purchasingPower || 0) / (calc.currentValue || 1)) * 100).toFixed(1)}%` },
                ]}
              />

              <ChartPanel
                title="Inflation Impact: Future Cost Escalation"
                type="area"
                data={calc.yearlyBreakdown || []}
                xKey="year"
                series={[
                  { key: "futureCost", name: "Cost of Same Basket (₹)", color: "#EF4444" },
                  { key: "purchasingPower", name: "Purchasing Power of Cash (₹)", color: "#3B82F6" },
                ]}
              />

              <TableDisplay
                title="Year-by-Year Inflation Schedule"
                columns={[
                  { key: "year", label: "Year", align: "center" as const },
                  { key: "futureCost", label: "Future Cost (₹)", align: "right" as const, format: (v: number) => formatCurrency(v) },
                  { key: "purchasingPower", label: "Purchasing Power (₹)", align: "right" as const, format: (v: number) => formatCurrency(v) },
                  { key: "inflationPercent", label: "Price Increase", align: "right" as const },
                ]}
                data={calc.yearlyBreakdown || []}
              />
            </>
          )}

          {/* 2. RETIREMENT RESULTS */}
          {calc.type === "retirement" && (
            <>
              <ResultDisplay
                primaryMetric={{
                  label: "Target Retirement Corpus Required",
                  value: formatCurrency(calc.targetCorpus || 0),
                }}
                secondaryMetrics={[
                  { label: "Monthly Investment Needed Today", value: formatCurrency(calc.monthlySavingsNeeded || 0) },
                  { label: "Monthly Expenses at Retirement", value: formatCurrency(calc.monthlyExpenseAtRetirement || 0) },
                  { label: "Years to Accumulate", value: `${calc.yearsToRetire || 0} Years` },
                  { label: "Retirement Lifespan", value: `${calc.yearsInRetirement || 0} Years` },
                ]}
              />

              <ChartPanel
                title="Retirement Corpus Accumulation Trajectory"
                type="area"
                data={calc.yearlyBreakdown || []}
                xKey="year"
                series={[
                  { key: "corpusAccumulated", name: "Projected Corpus (₹)", color: "#10B981" },
                  { key: "targetCorpus", name: "Target Goal (₹)", color: "#6C63FF" },
                ]}
              />

              <TableDisplay
                title="Annual Retirement Corpus Milestones"
                columns={[
                  { key: "year", label: "Milestone", align: "center" as const },
                  { key: "corpusAccumulated", label: "Accumulated Corpus (₹)", align: "right" as const, format: (v: number) => formatCurrency(v) },
                  { key: "targetCorpus", label: "Target Corpus (₹)", align: "right" as const, format: (v: number) => formatCurrency(v) },
                ]}
                data={calc.yearlyBreakdown || []}
              />
            </>
          )}

          {/* 3. SAVINGS GOAL RESULTS */}
          {calc.type === "savings-goal" && (
            <>
              <ResultDisplay
                primaryMetric={{
                  label: "Required Monthly Contribution",
                  value: formatCurrency(calc.monthlyDepositNeeded || 0),
                }}
                secondaryMetrics={[
                  { label: "Target Goal Amount", value: formatCurrency(calc.targetGoal || 0) },
                  { label: "Total Capital Deposited", value: formatCurrency(calc.totalInvested || 0) },
                  { label: "Compounding Growth Generated", value: formatCurrency(calc.totalReturns || 0) },
                  { label: "Growth Ratio", value: `${(((calc.totalReturns || 0) / (calc.totalInvested || 1)) * 100).toFixed(1)}%` },
                ]}
              />

              <ChartPanel
                title="Savings Goal Accumulation Path"
                type="area"
                data={calc.yearlyBreakdown || []}
                xKey="year"
                series={[
                  { key: "totalValue", name: "Total Portfolio Value (₹)", color: "#10B981" },
                  { key: "investedAmount", name: "Total Deposited (₹)", color: "#3B82F6" },
                ]}
              />

              <TableDisplay
                title="Year-by-Year Goal Progress"
                columns={[
                  { key: "year", label: "Year", align: "center" as const },
                  { key: "investedAmount", label: "Principal Saved (₹)", align: "right" as const, format: (v: number) => formatCurrency(v) },
                  { key: "totalValue", label: "Total Wealth (₹)", align: "right" as const, format: (v: number) => formatCurrency(v) },
                  { key: "target", label: "Goal Target (₹)", align: "right" as const, format: (v: number) => formatCurrency(v) },
                ]}
                data={calc.yearlyBreakdown || []}
              />
            </>
          )}

          {/* 4. DEBT PAYOFF RESULTS */}
          {calc.type === "debt-payoff" && (
            <>
              <ResultDisplay
                primaryMetric={{
                  label: "Time to Become Debt-Free",
                  value: calc.isPayoffPossible ? `${calc.monthsToPayoff} Months (${calc.yearsToPayoff} Yrs)` : "Payment Too Low",
                }}
                secondaryMetrics={[
                  { label: "Total Interest Payable", value: formatCurrency(calc.totalInterestPaid || 0) },
                  { label: "Total Amount Repaid", value: formatCurrency(calc.totalAmountPaid || 0) },
                  { label: "Interest Saved with Extra Pay", value: formatCurrency(calc.interestSaved || 0) },
                  { label: "Time Saved", value: `${calc.timeSavedMonths || 0} Months` },
                ]}
              />

              {calc.monthlySchedule && calc.monthlySchedule.length > 0 && (
                <TableDisplay
                  title="Monthly Debt Payoff Schedule"
                  columns={[
                    { key: "period", label: "Period", align: "center" as const },
                    { key: "monthlyPayment", label: "Payment (₹)", align: "right" as const, format: (v: number) => formatCurrency(v) },
                    { key: "principalPaid", label: "Principal (₹)", align: "right" as const, format: (v: number) => formatCurrency(v) },
                    { key: "interestPaid", label: "Interest (₹)", align: "right" as const, format: (v: number) => formatCurrency(v) },
                    { key: "remainingDebt", label: "Remaining Debt (₹)", align: "right" as const, format: (v: number) => formatCurrency(v) },
                  ]}
                  data={calc.monthlySchedule || []}
                  pageSize={10}
                />
              )}
            </>
          )}

          {/* 5. FD RESULTS */}
          {calc.type === "fd" && (
            <>
              <ResultDisplay
                primaryMetric={{
                  label: "FD Maturity / Payout Value",
                  value: formatCurrency(calc.maturity || 0),
                }}
                secondaryMetrics={[
                  { label: "Total Deposit Principal", value: formatCurrency(calc.totalDeposit || 0) },
                  { label: "Total Interest Earned", value: formatCurrency(calc.interestEarned || 0) },
                  { label: "Applied Rate of Interest", value: `${calc.appliedRate}% p.a.` },
                  { label: "Effective Annual Yield (APY)", value: `${calc.apy}%` },
                ]}
              />

              {(calc.periodicPayout || 0) > 0 && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs font-semibold text-emerald-400">
                  <span>Periodic Interest Payout ({calc.payoutOption}):</span>
                  <span className="font-mono text-sm font-bold">{formatCurrency(calc.periodicPayout || 0)}</span>
                </div>
              )}

              <ChartPanel
                title="Fixed Deposit Maturity Growth"
                type="area"
                data={calc.yearlyBreakdown || []}
                xKey="year"
                series={[
                  { key: "investedAmount", name: "Principal Deposit (₹)", color: "#3B82F6" },
                  { key: "totalValue", name: "FD Maturity Value (₹)", color: "#10B981" },
                ]}
              />

              <TableDisplay
                title="FD Compounding Growth Schedule"
                columns={[
                  { key: "year", label: "Year", align: "center" as const },
                  { key: "investedAmount", label: "Principal (₹)", align: "right" as const, format: (v: number) => formatCurrency(v) },
                  { key: "interestEarned", label: "Interest Earned (₹)", align: "right" as const, format: (v: number) => formatCurrency(v) },
                  { key: "totalValue", label: "Total Value (₹)", align: "right" as const, format: (v: number) => formatCurrency(v) },
                ]}
                data={calc.yearlyBreakdown || []}
              />
            </>
          )}

          {/* 6. RD RESULTS */}
          {calc.type === "rd" && (
            <>
              <ResultDisplay
                primaryMetric={{
                  label: "RD Maturity Value",
                  value: formatCurrency(calc.maturity || 0),
                }}
                secondaryMetrics={[
                  { label: "Total Deposited Amount", value: formatCurrency(calc.totalDeposit || 0) },
                  { label: "Total Interest Earned", value: formatCurrency(calc.interestEarned || 0) },
                  { label: "Applied Interest Rate", value: `${calc.appliedRate}% p.a.` },
                  { label: "Effective Growth", value: `${(((calc.interestEarned || 0) / (calc.totalDeposit || 1)) * 100).toFixed(1)}%` },
                ]}
              />

              <ChartPanel
                title="Recurring Deposit Growth Trajectory"
                type="area"
                data={calc.yearlyBreakdown || []}
                xKey="year"
                series={[
                  { key: "investedAmount", name: "Cumulative Deposit (₹)", color: "#3B82F6" },
                  { key: "totalValue", name: "Total RD Balance (₹)", color: "#10B981" },
                ]}
              />

              <TableDisplay
                title="RD Amortization Schedule"
                columns={[
                  { key: "year", label: "Year", align: "center" as const },
                  { key: "investedAmount", label: "Total Deposited (₹)", align: "right" as const, format: (v: number) => formatCurrency(v) },
                  { key: "interestEarned", label: "Interest Earned (₹)", align: "right" as const, format: (v: number) => formatCurrency(v) },
                  { key: "totalValue", label: "Maturity Balance (₹)", align: "right" as const, format: (v: number) => formatCurrency(v) },
                ]}
                data={calc.yearlyBreakdown || []}
              />
            </>
          )}

          {/* 7. SIMPLE INTEREST RESULTS */}
          {calc.type === "simple" && (
            <>
              <ResultDisplay
                primaryMetric={{
                  label: "Total Maturity Amount",
                  value: formatCurrency(calc.maturity || 0),
                }}
                secondaryMetrics={[
                  { label: "Principal Invested", value: formatCurrency(calc.totalDeposit || 0) },
                  { label: "Simple Interest Earned", value: formatCurrency(calc.interestEarned || 0) },
                  { label: "Interest Rate", value: `${calc.appliedRate}% p.a.` },
                  { label: "Total Growth", value: `${(((calc.interestEarned || 0) / (calc.totalDeposit || 1)) * 100).toFixed(1)}%` },
                ]}
              />

              <ChartPanel
                title="Simple Interest Accumulation"
                type="area"
                data={calc.yearlyBreakdown || []}
                xKey="year"
                series={[
                  { key: "investedAmount", name: "Principal (₹)", color: "#3B82F6" },
                  { key: "totalValue", name: "Total Return (₹)", color: "#6C63FF" },
                ]}
              />

              <TableDisplay
                title="Simple Interest Year-by-Year Table"
                columns={[
                  { key: "year", label: "Year", align: "center" as const },
                  { key: "investedAmount", label: "Principal (₹)", align: "right" as const, format: (v: number) => formatCurrency(v) },
                  { key: "interestEarned", label: "Interest (₹)", align: "right" as const, format: (v: number) => formatCurrency(v) },
                  { key: "totalValue", label: "Total Balance (₹)", align: "right" as const, format: (v: number) => formatCurrency(v) },
                ]}
                data={calc.yearlyBreakdown || []}
              />
            </>
          )}

          {/* 8. COMPOUND INTEREST (DEFAULT) RESULTS */}
          {calc.type === "compound" && (
            <>
              <ResultDisplay
                primaryMetric={{
                  label: "Maturity / Future Value",
                  value: formatCurrency(calc.maturity || 0),
                }}
                secondaryMetrics={[
                  { label: "Total Capital Invested", value: formatCurrency(calc.totalDeposit || 0) },
                  { label: "Compound Interest Earned", value: formatCurrency(calc.interestEarned || 0) },
                  { label: "Total Growth Percentage", value: `${calc.growthPercent}%` },
                  { label: "Compounding Intervals", value: `${compoundingFreq}x per Year` },
                ]}
              />

              <ChartPanel
                title="Compound Interest Growth Curve"
                type="area"
                data={calc.yearlyBreakdown || []}
                xKey="year"
                series={[
                  { key: "investedAmount", name: "Total Deposited (₹)", color: "#3B82F6" },
                  { key: "totalValue", name: "Compound Growth (₹)", color: "#10B981" },
                ]}
              />

              <TableDisplay
                title="Compound Interest Schedule"
                columns={[
                  { key: "year", label: "Year", align: "center" as const },
                  { key: "investedAmount", label: "Deposited (₹)", align: "right" as const, format: (v: number) => formatCurrency(v) },
                  { key: "interestEarned", label: "Interest (₹)", align: "right" as const, format: (v: number) => formatCurrency(v) },
                  { key: "totalValue", label: "Total Balance (₹)", align: "right" as const, format: (v: number) => formatCurrency(v) },
                ]}
                data={calc.yearlyBreakdown || []}
              />
            </>
          )}
        </div>
      </div>

      <SEOContent tool={tool} />
      <RelatedTools slugs={tool.related} />
    </div>
  );
};
