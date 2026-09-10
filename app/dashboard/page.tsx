"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Clock, ShieldCheck, UserCheck, Sparkles, LogIn, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ALL_TOOLS } from "@/lib/constants";

export default function DashboardPage() {
  const { user, openAuthModal } = useAuth();

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-xl mx-auto gap-6">
        <div className="w-16 h-16 rounded-2xl bg-surface-raised border border-border flex items-center justify-center text-accent shadow-md">
          <UserCheck className="w-8 h-8 text-accent" />
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl sm:text-4xl font-extrabold text-text-primary tracking-tight">
            Account Dashboard
          </h1>
          <p className="text-sm sm:text-base font-medium text-text-secondary leading-relaxed">
            All {ALL_TOOLS.length} free utilities are available 100% without login. Create an account or sign in to manage your Pro subscription and saved history.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-sm pt-2">
          <Button
            variant="primary"
            size="md"
            className="w-full font-bold"
            onClick={() => openAuthModal("login")}
          >
            Log In to Account
          </Button>
          <Button
            variant="secondary"
            size="md"
            className="w-full font-bold"
            onClick={() => openAuthModal("signup")}
          >
            Create New Account
          </Button>
        </div>

        <div className="pt-6 border-t border-border w-full flex items-center justify-center gap-2 text-xs font-semibold text-text-tertiary">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>No account required to use free tools.</span>
          <Link href="/tools" className="text-accent hover:underline flex items-center gap-1 font-bold ml-1">
            Browse Tools <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 py-6">
      {/* Dashboard Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-surface border border-border rounded-xl p-6 shadow-subtle">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent text-white flex items-center justify-center font-extrabold text-lg shadow-sm">
            {user.name.charAt(0)}
          </div>
          <div className="flex flex-col gap-0.5">
            <h1 className="text-lg sm:text-xl font-bold text-text-primary">{user.name}</h1>
            <p className="text-xs sm:text-sm font-medium text-text-secondary">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user.plan === "pro" ? (
            <Badge variant="popular" className="px-3 py-1 text-xs font-bold bg-amber-500/20 text-amber-400 border-amber-500/30">
              <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-400 inline" /> {user.planName || "Pro Subscriber"}
            </Badge>
          ) : (
            <Badge variant="category" className="px-3 py-1 text-xs font-semibold">
              Free Plan
            </Badge>
          )}

          <Link href="/pricing">
            <Button variant={user.plan === "pro" ? "secondary" : "primary"} size="sm" className="font-bold">
              {user.plan === "pro" ? "Manage Plan" : "Upgrade Plan"}
            </Button>
          </Link>
        </div>
      </div>

      {/* Subscription Details Banner if Pro */}
      {user.plan === "pro" && (
        <div className="bg-gradient-to-r from-blue-900/30 via-indigo-900/30 to-purple-900/30 border border-blue-500/30 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-md">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-amber-400 shrink-0" />
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-bold text-text-primary">
                ToolVerse {user.planName || "Pro Subscription"} Active
              </span>
              <span className="text-xs font-medium text-text-secondary">
                Subscribed: {user.subscriptionDate || "Recently"} • Billing Status: {user.renewalDate || "Renews Annually"}
              </span>
            </div>
          </div>
          <span className="text-xs font-mono font-extrabold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-md border border-emerald-500/20">
            ✓ Full Pro Features Active
          </span>
        </div>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card variant="base" className="p-4 flex flex-col gap-1">
          <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Tools Used Today</span>
          <span className="text-2xl sm:text-3xl font-extrabold font-mono text-text-primary">14</span>
        </Card>
        <Card variant="base" className="p-4 flex flex-col gap-1">
          <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Saved Calculations</span>
          <span className="text-2xl sm:text-3xl font-extrabold font-mono text-text-primary">8</span>
        </Card>
        <Card variant="base" className="p-4 flex flex-col gap-1">
          <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Invoices Created</span>
          <span className="text-2xl sm:text-3xl font-extrabold font-mono text-text-primary">12</span>
        </Card>
        <Card variant="base" className="p-4 flex flex-col gap-1">
          <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Storage Quota</span>
          <span className="text-2xl sm:text-3xl font-extrabold font-mono text-text-primary">
            {user.plan === "pro" ? "500 MB (Pro)" : "10 MB (Free)"}
          </span>
        </Card>
      </div>

      {/* Recent Saved Calculations */}
      <div className="flex flex-col gap-4">
        <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
          <Clock className="w-4.5 h-4.5 text-text-secondary" /> Recent Saved Calculations
        </h3>

        <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-subtle text-xs sm:text-sm font-medium">
          <table className="w-full text-left">
            <thead className="bg-surface-raised border-b border-border text-text-secondary uppercase text-xs font-bold">
              <tr>
                <th className="px-4 py-3">Tool Name</th>
                <th className="px-4 py-3">Key Output</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              <tr className="hover:bg-surface-raised/40">
                <td className="px-4 py-3 font-semibold text-text-primary">SIP Calculator</td>
                <td className="px-4 py-3 font-mono font-bold text-emerald-500">₹45,23,891 Maturity</td>
                <td className="px-4 py-3 text-text-tertiary">2026-09-02</td>
                <td className="px-4 py-3 text-right">
                  <Link href="/finance/sip-calculator" className="text-accent hover:underline font-mono font-bold text-xs">
                    Open →
                  </Link>
                </td>
              </tr>
              <tr className="hover:bg-surface-raised/40">
                <td className="px-4 py-3 font-semibold text-text-primary">Invoice Generator</td>
                <td className="px-4 py-3 font-mono font-bold text-emerald-500">INV-2026-001 (₹95,000)</td>
                <td className="px-4 py-3 text-text-tertiary">2026-09-01</td>
                <td className="px-4 py-3 text-right">
                  <Link href="/business/invoice-generator" className="text-accent hover:underline font-mono font-bold text-xs">
                    Open →
                  </Link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
