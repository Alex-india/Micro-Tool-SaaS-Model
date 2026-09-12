import React from "react";
import { Metadata } from "next";
import { SITE_NAME } from "@/lib/constants";
import { Scale, CheckCircle2, AlertTriangle, ShieldCheck, FileCheck, HelpCircle } from "lucide-react";
import { BackButton } from "@/components/ui/BackButton";

export const metadata: Metadata = {
  title: `Terms & Conditions - ${SITE_NAME}`,
  description: `Read the Terms of Service and user agreement governing access to and use of the ${SITE_NAME} utility suite.`,
};

export default function TermsAndConditionsPage() {
  return (
    <div className="flex flex-col gap-8 py-6 max-w-4xl mx-auto w-full">
      {/* Back Navigation */}
      <div className="flex items-center justify-between gap-4">
        <BackButton fallbackHref="/tools" label="Back to Tools" variant="outline" size="sm" />
        <span className="text-xs font-mono font-semibold text-text-tertiary">
          Terms & Conditions
        </span>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-border pb-6">
        <div className="flex items-center gap-2 text-accent text-xs font-bold uppercase tracking-wider">
          <Scale className="w-4 h-4" />
          Legal Agreement
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-text-primary tracking-tight">
          Terms & Conditions
        </h1>
      </div>

      {/* Summary Box */}
      <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 flex flex-col gap-4 shadow-subtle">
        <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-accent" />
          Quick Summary of Terms
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-text-secondary">
          <div className="p-3 bg-surface-raised rounded-lg border border-border flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>You may freely use all standard utilities for personal and commercial projects.</span>
          </div>
          <div className="p-3 bg-surface-raised rounded-lg border border-border flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>Calculations are informational and should not substitute professional legal/financial counsel.</span>
          </div>
          <div className="p-3 bg-surface-raised rounded-lg border border-border flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>Your files and data remain 100% your private property. We claim zero ownership.</span>
          </div>
          <div className="p-3 bg-surface-raised rounded-lg border border-border flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>Fair use applies: automated scraping and abuse of backend rate endpoints are prohibited.</span>
          </div>
        </div>
      </div>

      {/* Detailed Legal Clauses */}
      <div className="flex flex-col gap-8 text-sm text-text-secondary leading-relaxed">
        {/* Clause 1 */}
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-text-primary">
            1. Acceptance of Terms
          </h2>
          <p>
            By accessing or using {SITE_NAME} (the "Service", "Platform", or "Website"), you agree to be bound by these Terms & Conditions ("Terms"). If you do not agree to these Terms, you must immediately discontinue use of the Platform.
          </p>
        </section>

        {/* Clause 2 */}
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-text-primary">
            2. Permitted Use & License
          </h2>
          <p>
            {SITE_NAME} grants you a non-exclusive, revocable, non-transferable, worldwide license to use our calculators, converters, formatting tools, and media utilities for both personal calculations and professional business workflows.
          </p>
          <ul className="list-disc pl-5 flex flex-col gap-1.5 text-xs sm:text-sm">
            <li>You may use generated outputs (such as invoices, formatted data, converted media, calculation tables) in your personal and commercial projects without royalty obligations.</li>
            <li>You agree not to reverse engineer, clone, mirror, or launch automated scraping attacks aimed at destabilizing platform availability.</li>
          </ul>
        </section>

        {/* Clause 3 */}
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            3. Disclaimer of Financial, Tax & Legal Advice
          </h2>
          <p className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200/90 text-xs sm:text-sm leading-relaxed">
            <strong>Important Notice:</strong> All calculators and tools provided on {SITE_NAME} (including but not limited to SIP, EMI, Income Tax, GST, Capital Gains, and Business Runway tools) are intended strictly for informational and educational estimation purposes. Mathematical simulations may not account for real-world bank processing fees, market fluctuations, changes in municipal tax laws, or individual exemptions. Please consult a licensed Chartered Accountant, Certified Financial Planner, or legal advisor prior to executing financial agreements.
          </p>
        </section>

        {/* Clause 4 */}
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-text-primary">
            4. Intellectual Property & User Data Ownership
          </h2>
          <p>
            All branding, user interface designs, logos, software code, and educational content on {SITE_NAME} are the proprietary intellectual property of {SITE_NAME}. You retain complete, unrestricted ownership of all text, documents, files, and assets you input into or generate with our browser-based utilities.
          </p>
        </section>

        {/* Clause 5 */}
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-text-primary">
            5. Limitation of Liability
          </h2>
          <p>
            To the maximum extent permitted by applicable law, {SITE_NAME} and its creators shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of, or inability to use, any tool or service on this platform.
          </p>
        </section>

        {/* Clause 6 */}
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-text-primary">
            6. Changes to Terms
          </h2>
          <p>
            We reserve the right to modify these Terms at any time. Continued use of the platform following any modifications constitutes your explicit acceptance of the revised Terms.
          </p>
        </section>

        {/* Clause 7 */}
        <section className="flex flex-col gap-3 border-t border-border pt-6">
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-400" />
            7. Inquiries & Legal Notices
          </h2>
          <p>
            For legal inquiries, copyright notices, or clarification on our terms of service, please contact us:
          </p>
          <div className="p-4 rounded-xl bg-surface border border-border text-xs flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <span className="font-mono text-text-primary">legal@toolverse.app</span>
            <a href="/contact" className="text-accent hover:underline font-semibold">
              Visit Contact Desk →
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
