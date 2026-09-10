"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SITE_NAME, ALL_TOOLS } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  Check,
  X,
  ShieldCheck,
  Sparkles,
  Zap,
  Lock,
  CheckCircle2,
  Crown,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Infinity,
  ArrowRight
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { BackButton } from "@/components/ui/BackButton";

export default function PricingPage() {
  const router = useRouter();
  const { user, upgradeToPro, openAuthModal } = useAuth();
  const [purchasingPlan, setPurchasingPlan] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const handleSubscribe = async (planType: "monthly" | "yearly" | "lifetime", planName: string) => {
    if (!user) {
      openAuthModal(
        "signup",
        `Sign up or Log in required to purchase the ${planName} plan.`
      );
      return;
    }

    setPurchasingPlan(planType);
    await upgradeToPro(planType);
    setPurchasingPlan(null);
    setSuccessMessage(`🎉 Success! You have unlocked ${planName}. Directing to your dashboard...`);
    
    setTimeout(() => {
      router.push("/dashboard");
    }, 1600);
  };

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const faqs = [
    {
      question: "Do I need an account to use the free tools?",
      answer: "No! All free tools are available instantly without creating an account or providing an email address. Simply visit the tool page and use it right away."
    },
    {
      question: "What is the difference between Monthly (₹399) and Yearly (₹3,999)?",
      answer: `The Yearly Pro plan saves you ₹789 per year (equivalent to just ₹333/month) and includes full access to all ${ALL_TOOLS.length}+ premium tools, 500MB file limits, unlimited batch processing, and custom branding.`
    },
    {
      question: "What does Lifetime Access (₹24,999) include?",
      answer: "Lifetime Access is a one-time payment with perpetual access. You get every current and future tool, commercial usage rights, white-label exports, and direct 1-on-1 VIP developer support without ever paying a recurring fee."
    },
    {
      question: "How does the 7-Day Money-Back Guarantee work?",
      answer: "If you are not 100% satisfied with your paid plan within 7 days of purchase, send a quick message to our support team and we will issue a full refund with no questions asked."
    },
    {
      question: "Are my calculations and files kept private?",
      answer: "Yes, 100%. All processing runs locally inside your browser using client-side Web Workers and WebAssembly. Your data and uploaded documents never touch our servers."
    },
    {
      question: "Which payment options are supported?",
      answer: "We support UPI (GPay, PhonePe, Paytm), All Major Debit/Credit Cards, NetBanking, Razorpay, and Stripe for instant processing."
    }
  ];

  return (
    <div className="flex flex-col gap-10 py-6 max-w-6xl mx-auto px-4 sm:px-6">
      {/* Back Navigation */}
      <div className="flex items-center justify-between gap-4">
        <BackButton fallbackHref="/tools" label="Back to Tools" variant="outline" size="sm" />
        <span className="text-xs font-mono font-semibold text-text-tertiary">
          Plans & Pricing
        </span>
      </div>

      {/* Header Section */}
      <div className="text-center flex flex-col items-center gap-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs sm:text-sm font-bold shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Simple & Transparent Pricing • No Hidden Fees</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-text-primary tracking-tight leading-tight">
          Pick the right plan for your tools
        </h1>
        <p className="text-sm sm:text-base font-medium text-text-secondary leading-relaxed max-w-2xl">
          Start with essential free utilities or unlock unlimited batch processing, high file size limits, saved history, and lifetime access.
        </p>
      </div>

      {/* Success Notification Banner */}
      {successMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center justify-center gap-3 text-sm font-bold text-emerald-400 max-w-2xl mx-auto w-full shadow-lg animate-in fade-in">
          <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* 4 Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
        
        {/* PLAN 1: FREE FOREVER */}
        <Card variant="base" className="flex flex-col justify-between p-6 bg-surface border-border hover:border-border-hover transition-all">
          <div className="flex flex-col gap-5">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-extrabold text-text-primary">Free Forever</h3>
                <span className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary px-2 py-0.5 rounded bg-surface-raised border border-border">Starter</span>
              </div>
              <p className="text-xs font-medium text-text-secondary mt-1 min-h-[36px]">
                For casual daily tasks & quick basic calculations
              </p>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold font-mono text-text-primary">₹0</span>
              <span className="text-xs font-semibold text-text-tertiary">/ forever</span>
            </div>

            <div className="border-t border-border pt-4">
              <span className="text-xs font-bold text-text-tertiary uppercase tracking-wider block mb-3">Included Features</span>
              <ul className="flex flex-col gap-2.5 text-xs font-medium text-text-secondary">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-text-primary font-semibold">50+ Essential Tools</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>No login required</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>PDF size up to 5MB</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Single image compression</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>100% Client-side privacy</span>
                </li>
                <li className="flex items-center gap-2 text-text-tertiary opacity-60">
                  <X className="w-4 h-4 shrink-0 text-text-tertiary" />
                  <span>No batch processing</span>
                </li>
                <li className="flex items-center gap-2 text-text-tertiary opacity-60">
                  <X className="w-4 h-4 shrink-0 text-text-tertiary" />
                  <span>No saved history</span>
                </li>
              </ul>
            </div>
          </div>

          <Link href="/tools" className="mt-8">
            <Button variant="secondary" className="w-full font-bold text-xs sm:text-sm" size="md">
              Use Free Tools
            </Button>
          </Link>
        </Card>

        {/* PLAN 2: MONTHLY PRO (₹399/month) */}
        <Card variant="base" className="flex flex-col justify-between p-6 bg-surface border-border hover:border-accent/40 transition-all">
          <div className="flex flex-col gap-5">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-extrabold text-text-primary">Monthly Pro</h3>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">Monthly</span>
              </div>
              <p className="text-xs font-medium text-text-secondary mt-1 min-h-[36px]">
                Flexible access for active freelancers & creators
              </p>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold font-mono text-text-primary">₹399</span>
              <span className="text-xs font-semibold text-text-tertiary">/ month</span>
            </div>

            <div className="border-t border-border pt-4">
              <span className="text-xs font-bold text-text-tertiary uppercase tracking-wider block mb-3">Everything in Free +</span>
              <ul className="flex flex-col gap-2.5 text-xs font-medium text-text-primary">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="font-semibold">150+ Expanded Tools</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>PDF size up to 50MB</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Batch image compression (up to 20)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>CSV & PDF Export options</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Dashboard history storage</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Standard Email Support</span>
                </li>
                <li className="flex items-center gap-2 text-text-tertiary opacity-60">
                  <X className="w-4 h-4 shrink-0 text-text-tertiary" />
                  <span>No custom branding templates</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-1.5">
            <Button
              variant="secondary"
              className="w-full font-bold text-xs sm:text-sm border-border-hover hover:border-accent"
              size="md"
              isLoading={purchasingPlan === "monthly"}
              onClick={() => handleSubscribe("monthly", "Monthly Pro (₹399)")}
            >
              {user && user.planType === "monthly" ? "Current Plan" : "Upgrade ₹399/mo"}
            </Button>
            {!user && (
              <span className="text-[10px] font-semibold text-text-tertiary text-center">
                *Requires Account Signup
              </span>
            )}
          </div>
        </Card>

        {/* PLAN 3: YEARLY PRO (₹3,999/year) - FEATURED / BEST VALUE */}
        <Card variant="base" className="flex flex-col justify-between p-6 border-accent/70 relative shadow-xl bg-gradient-to-b from-surface via-surface to-accent/5">
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-accent text-white text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-md flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Best Value (Save 16%)
          </div>

          <div className="flex flex-col gap-5 pt-1">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-extrabold text-text-primary">Yearly Pro</h3>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">Annual</span>
              </div>
              <p className="text-xs font-medium text-text-secondary mt-1 min-h-[36px]">
                Save ₹789/yr (₹333/mo). Unlocks all power features!
              </p>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold font-mono text-accent">₹3,999</span>
              <span className="text-xs font-semibold text-text-tertiary">/ year</span>
            </div>

            <div className="border-t border-border pt-4">
              <span className="text-xs font-bold text-accent uppercase tracking-wider block mb-3">All Pro Features Included</span>
              <ul className="flex flex-col gap-2.5 text-xs font-medium text-text-primary">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-accent shrink-0" />
                  <span className="font-extrabold text-accent">ALL {ALL_TOOLS.length}+ Pro Tools Unlocked</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-accent shrink-0" />
                  <span className="font-semibold">Unlimited PDF size (up to 500MB)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-accent shrink-0" />
                  <span className="font-semibold">Unlimited Batch Processing</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-accent shrink-0" />
                  <span>Custom invoice & template branding</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-accent shrink-0" />
                  <span>High-speed priority processing</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-accent shrink-0" />
                  <span>Cloud history & bookmark sync</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-accent shrink-0" />
                  <span>Priority Email & Live Chat</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-1.5">
            <Button
              variant="primary"
              className="w-full font-extrabold text-xs sm:text-sm shadow-md"
              size="md"
              isLoading={purchasingPlan === "yearly"}
              onClick={() => handleSubscribe("yearly", "Yearly Pro (₹3,999)")}
            >
              {user && user.planType === "yearly" ? "Current Active Plan" : "Upgrade ₹3,999/yr"}
            </Button>
            {!user && (
              <span className="text-[10px] font-semibold text-text-tertiary text-center">
                *Requires Account Signup
              </span>
            )}
          </div>
        </Card>

        {/* PLAN 4: LIFETIME VIP (₹24,999 / One-time) */}
        <Card variant="base" className="flex flex-col justify-between p-6 bg-gradient-to-b from-surface via-surface to-purple-950/20 border-purple-500/40 hover:border-purple-500 transition-all">
          <div className="flex flex-col gap-5">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-extrabold text-text-primary flex items-center gap-1.5">
                  <Crown className="w-4 h-4 text-amber-400" /> Lifetime VIP
                </h3>
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">Perpetual</span>
              </div>
              <p className="text-xs font-medium text-text-secondary mt-1 min-h-[36px]">
                One-time payment. Own forever with zero recurring fees.
              </p>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold font-mono text-purple-300">₹24,999</span>
              <span className="text-xs font-semibold text-text-tertiary">/ one-time</span>
            </div>

            <div className="border-t border-border pt-4">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider block mb-3">Ultimate VIP Access</span>
              <ul className="flex flex-col gap-2.5 text-xs font-medium text-text-primary">
                <li className="flex items-center gap-2">
                  <Infinity className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="font-extrabold text-purple-300">All Yearly Features Forever</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="font-semibold">Future 500+ tools unlocked automatically</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Commercial & White-label rights</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>1-on-1 VIP Direct Dev Support</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Early access to AI & automation</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Zero monthly or annual renewals</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-1.5">
            <Button
              variant="secondary"
              className="w-full font-extrabold text-xs sm:text-sm border-purple-500/40 hover:bg-purple-500/10 text-purple-300"
              size="md"
              isLoading={purchasingPlan === "lifetime"}
              onClick={() => handleSubscribe("lifetime", "Lifetime VIP (₹24,999)")}
            >
              {user && user.planType === "lifetime" ? "Lifetime Unlocked" : "Get Lifetime Access"}
            </Button>
            {!user && (
              <span className="text-[10px] font-semibold text-text-tertiary text-center">
                *Requires Account Signup
              </span>
            )}
          </div>
        </Card>

      </div>

      {/* Trust & Guarantee Callouts */}
      <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-subtle">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="flex flex-col gap-0.5">
            <h3 className="text-base sm:text-lg font-bold text-text-primary">100% Risk-Free 7-Day Money-Back Guarantee</h3>
            <p className="text-xs sm:text-sm font-medium text-text-secondary">
              Try any paid plan risk-free. If you are not completely satisfied, email us within 7 days for a full refund.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0 text-xs font-semibold text-text-tertiary">
          <div className="flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-accent" />
            <span>UPI, Cards & NetBanking</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>256-Bit SSL Encrypted</span>
          </div>
        </div>
      </div>

      {/* Feature Comparison Table */}
      <div className="flex flex-col gap-6 pt-4">
        <div className="text-center flex flex-col gap-1">
          <h2 className="text-xl sm:text-3xl font-extrabold text-text-primary">Compare Plan Features</h2>
          <p className="text-xs sm:text-sm font-medium text-text-secondary">A side-by-side look at what each plan offers</p>
        </div>

        <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-subtle text-xs sm:text-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-raised border-b border-border text-text-primary font-bold text-xs uppercase">
                  <th className="p-4">Feature</th>
                  <th className="p-4 text-center">Free (₹0)</th>
                  <th className="p-4 text-center">Monthly (₹399)</th>
                  <th className="p-4 text-center text-accent">Yearly (₹3,999)</th>
                  <th className="p-4 text-center text-purple-300">Lifetime (₹24,999)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-medium text-text-secondary">
                <tr className="hover:bg-surface-raised/30">
                  <td className="p-4 font-bold text-text-primary">Tool Access</td>
                  <td className="p-4 text-center">50+ Basic Tools</td>
                  <td className="p-4 text-center">150+ Advanced Tools</td>
                  <td className="p-4 text-center font-bold text-accent">All {ALL_TOOLS.length}+ Pro Tools</td>
                  <td className="p-4 text-center font-bold text-purple-300">All {ALL_TOOLS.length}+ & Future Tools</td>
                </tr>
                <tr className="hover:bg-surface-raised/30">
                  <td className="p-4 font-bold text-text-primary">PDF Upload Limit</td>
                  <td className="p-4 text-center">5 MB</td>
                  <td className="p-4 text-center">50 MB</td>
                  <td className="p-4 text-center font-bold text-accent">500 MB</td>
                  <td className="p-4 text-center font-bold text-purple-300">500 MB (Unlimited)</td>
                </tr>
                <tr className="hover:bg-surface-raised/30">
                  <td className="p-4 font-bold text-text-primary">Batch Image Processing</td>
                  <td className="p-4 text-center">Single File</td>
                  <td className="p-4 text-center">Up to 20 files</td>
                  <td className="p-4 text-center font-bold text-accent">Unlimited Batch</td>
                  <td className="p-4 text-center font-bold text-purple-300">Unlimited Batch</td>
                </tr>
                <tr className="hover:bg-surface-raised/30">
                  <td className="p-4 font-bold text-text-primary">Client-side Privacy</td>
                  <td className="p-4 text-center text-emerald-400 font-bold">100% Browser Local</td>
                  <td className="p-4 text-center text-emerald-400 font-bold">100% Browser Local</td>
                  <td className="p-4 text-center text-emerald-400 font-bold">100% Browser Local</td>
                  <td className="p-4 text-center text-emerald-400 font-bold">100% Browser Local</td>
                </tr>
                <tr className="hover:bg-surface-raised/30">
                  <td className="p-4 font-bold text-text-primary">Custom Branding</td>
                  <td className="p-4 text-center text-text-tertiary">❌</td>
                  <td className="p-4 text-center text-text-tertiary">❌</td>
                  <td className="p-4 text-center text-emerald-400 font-bold">✓ Included</td>
                  <td className="p-4 text-center text-purple-300 font-bold">✓ White-label Rights</td>
                </tr>
                <tr className="hover:bg-surface-raised/30">
                  <td className="p-4 font-bold text-text-primary">Saved History Sync</td>
                  <td className="p-4 text-center text-text-tertiary">❌</td>
                  <td className="p-4 text-center text-emerald-400">✓ Local Dashboard</td>
                  <td className="p-4 text-center text-emerald-400 font-bold">✓ Full Cloud Sync</td>
                  <td className="p-4 text-center text-purple-300 font-bold">✓ Perpetual Sync</td>
                </tr>
                <tr className="hover:bg-surface-raised/30">
                  <td className="p-4 font-bold text-text-primary">Support SLA</td>
                  <td className="p-4 text-center">Community</td>
                  <td className="p-4 text-center">24h Email</td>
                  <td className="p-4 text-center font-bold text-accent">Priority Chat & Email</td>
                  <td className="p-4 text-center font-bold text-purple-300">1-on-1 VIP Direct Support</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="flex flex-col gap-6 pt-4 max-w-4xl mx-auto w-full">
        <div className="text-center flex flex-col gap-1">
          <h2 className="text-xl sm:text-3xl font-extrabold text-text-primary flex items-center justify-center gap-2">
            <HelpCircle className="w-6 h-6 text-accent" /> Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm font-medium text-text-secondary">Have questions before choosing your plan?</p>
        </div>

        <div className="flex flex-col gap-3">
          {faqs.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={index}
                className="bg-surface border border-border rounded-xl overflow-hidden transition-all shadow-subtle"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-text-primary hover:text-accent transition-colors"
                >
                  <span>{faq.question}</span>
                  {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-accent shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-text-tertiary shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-4 pb-5 sm:px-5 sm:pb-5 text-xs sm:text-sm font-medium text-text-secondary leading-relaxed border-t border-border/40 pt-3">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom CTA Banner */}
      <div className="bg-gradient-to-r from-accent/15 via-surface to-accent/15 border border-accent/30 rounded-2xl p-8 text-center flex flex-col items-center gap-4 shadow-lg">
        <h3 className="text-xl sm:text-2xl font-extrabold text-text-primary">Ready to supercharge your daily tools?</h3>
        <p className="text-xs sm:text-sm text-text-secondary max-w-xl font-medium">
          Start for free today or get unlimited access to all {ALL_TOOLS.length}+ tools with zero risk under our 7-day money-back guarantee.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link href="/tools">
            <Button variant="secondary" size="md" className="font-bold">
              Browse All Tools
            </Button>
          </Link>
          <Button
            variant="primary"
            size="md"
            className="font-bold flex items-center gap-1.5"
            onClick={() => handleSubscribe("yearly", "Yearly Pro (₹3,999)")}
          >
            <span>Get Yearly Pro (₹3,999)</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
