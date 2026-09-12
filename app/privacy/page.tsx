import React from "react";
import { Metadata } from "next";
import { SITE_NAME } from "@/lib/constants";
import { ShieldCheck, Lock, EyeOff, Server, HardDrive, FileText, CheckCircle2 } from "lucide-react";
import { BackButton } from "@/components/ui/BackButton";

export const metadata: Metadata = {
  title: `Privacy Policy - ${SITE_NAME}`,
  description: `Learn how ${SITE_NAME} safeguards your privacy with 100% client-side computing, zero tracking logs, and transparent data practices.`,
};

export default function PrivacyPolicyPage() {
  return (
    <div className="flex flex-col gap-8 py-6 max-w-4xl mx-auto w-full">
      {/* Back Navigation */}
      <div className="flex items-center justify-between gap-4">
        <BackButton fallbackHref="/tools" label="Back to Tools" variant="outline" size="sm" />
        <span className="text-xs font-mono font-semibold text-text-tertiary">
          Privacy Policy
        </span>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-border pb-6">
        <div className="flex items-center gap-2 text-accent text-xs font-bold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          Transparency & Security
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-text-primary tracking-tight">
          Privacy Policy
        </h1>
      </div>

      {/* Core Privacy Guarantee Banner */}
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
          <Lock className="w-6 h-6" />
        </div>
        <div className="flex flex-col gap-1">
          <h2 className="text-base sm:text-lg font-bold text-text-primary">
            Our Fundamental Privacy Commitment
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
            At {SITE_NAME}, we believe privacy is a fundamental human right. All calculations, text transformations, and file conversions occur <strong>locally on your device</strong> inside your web browser. We never upload your raw files, calculations, or inputs to remote servers.
          </p>
        </div>
      </div>

      {/* Policy Sections */}
      <div className="flex flex-col gap-8 text-sm text-text-secondary leading-relaxed">
        {/* Section 1 */}
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <EyeOff className="w-5 h-5 text-accent" />
            1. Information We Do NOT Collect
          </h2>
          <p>
            Unlike conventional online utility portals, {SITE_NAME} operates under a strict <strong>Zero-Knowledge & Zero-Logging Architecture</strong>:
          </p>
          <ul className="list-disc pl-5 flex flex-col gap-1.5 text-xs sm:text-sm">
            <li><strong>No Input Logging:</strong> We do not log, capture, or store any numbers, financial figures, salary data, loan amounts, or text entered into our calculator tools.</li>
            <li><strong>No File Uploads:</strong> Files processed through our PDF Studio, Image Studio, and Social Media tools (e.g., PDFs, JPGs, PNGs, MP4s) are read into browser memory via HTML5 File and Web APIs. They never leave your device.</li>
            <li><strong>No Mandatory Personal Identification:</strong> You can utilize all standard utilities without providing your real name, phone number, physical address, or creating an account.</li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-indigo-400" />
            2. Local Storage & Cookies
          </h2>
          <p>
            We use minimal, privacy-respecting client-side storage mechanisms purely to remember user preferences:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-2">
            <div className="p-4 bg-surface rounded-xl border border-border flex flex-col gap-1.5">
              <span className="font-bold text-text-primary text-xs">Theme & UI Preferences</span>
              <p className="text-xs text-text-tertiary">Stored in local browser storage to remember your chosen theme and calculation history locally on your device.</p>
            </div>
            <div className="p-4 bg-surface rounded-xl border border-border flex flex-col gap-1.5">
              <span className="font-bold text-text-primary text-xs">No Invasive Tracking Cookies</span>
              <p className="text-xs text-text-tertiary">We do not employ cross-site tracking cookies, third-party advertising cookies, or behavioral profiling pixels.</p>
            </div>
          </div>
        </section>

        {/* Section 3 */}
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <Server className="w-5 h-5 text-purple-400" />
            3. Server-Side Infrastructure & Third-Party APIs
          </h2>
          <p>
            A tiny subset of tools require live public market rates (such as live currency exchange conversions). For these tools, our system fetches anonymized, public currency rate indexes. No personal identifiers or individual transaction amounts are transmitted during these lookups.
          </p>
        </section>

        {/* Section 4 */}
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            4. GDPR, CCPA & Global Compliance
          </h2>
          <p>
            Because we do not store, process, or sell your personal data on remote databases, compliance with GDPR (General Data Protection Regulation), CCPA (California Consumer Privacy Act), and DPDP (Digital Personal Data Protection) is built directly into our client-side software architecture.
          </p>
          <div className="p-4 rounded-xl bg-surface border border-border flex flex-col gap-2">
            <span className="font-semibold text-text-primary text-xs">Your Data Rights:</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <span className="flex items-center gap-1 text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5" /> Right to Erasure (Local)</span>
              <span className="flex items-center gap-1 text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5" /> Right to Access</span>
              <span className="flex items-center gap-1 text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5" /> Zero Data Brokerage</span>
            </div>
          </div>
        </section>

        {/* Section 5 */}
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-text-primary">
            5. Contacting Our Data Privacy Team
          </h2>
          <p>
            If you have questions, feedback, or concerns regarding our privacy policies or client-side architecture, please reach out to us directly:
          </p>
          <div className="p-4 rounded-xl bg-surface border border-border text-xs flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <div>
              <span className="text-text-primary font-semibold block">Privacy & Security Office</span>
              <span className="text-text-tertiary">Email: privacy@toolverse.app</span>
            </div>
            <a
              href="/contact"
              className="inline-flex items-center justify-center px-4 py-2 bg-accent text-white font-medium rounded-lg hover:bg-accent-hover transition-colors text-xs"
            >
              Contact Support
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
