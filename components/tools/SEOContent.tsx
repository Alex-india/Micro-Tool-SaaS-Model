"use client";

import React, { useState } from "react";
import { ToolMeta } from "@/lib/types";
import { 
  ChevronDown, 
  HelpCircle, 
  BookOpen, 
  Calculator, 
  CheckCircle2, 
  ListOrdered, 
  Lightbulb, 
  Layers, 
  Table2, 
  ShieldCheck, 
  AlertCircle 
} from "lucide-react";
import { generateWebApplicationSchema, generateBreadcrumbSchema, generateFAQSchema } from "@/lib/seo";
import { generateToolSEOArticle } from "@/lib/seo-content-engine";

export interface SEOContentProps {
  tool: ToolMeta;
}

export const SEOContent: React.FC<SEOContentProps> = ({ tool }) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const article = generateToolSEOArticle(tool);

  const webAppSchema = generateWebApplicationSchema(tool);
  const breadcrumbSchema = generateBreadcrumbSchema(tool);
  const faqSchema = generateFAQSchema(article.faqs);

  return (
    <article className="mt-16 pt-12 border-t border-border flex flex-col gap-12 max-w-5xl mx-auto w-full">
      {/* JSON-LD Schema Script Injections */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Header Badge */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <span className="text-[11px] font-bold uppercase tracking-widest text-accent bg-accent/10 px-3 py-1 rounded-full">
          In-Depth Technical & User Guide
        </span>
        <span className="text-[11px] font-mono text-text-tertiary">
          ~{article.wordCount} Words • Comprehensive Guide
        </span>
      </div>

      {/* Section 1: Overview & Definition */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-text-primary flex items-center gap-2.5">
          <BookOpen className="w-5 h-5 text-accent" />
          {article.introduction.title}
        </h2>
        <div className="flex flex-col gap-3 text-sm text-text-secondary leading-relaxed">
          {article.introduction.paragraphs.map((p, idx) => (
            <p key={idx}>{p}</p>
          ))}
        </div>

        {/* Key Takeaways Grid */}
        <div className="mt-3 p-5 rounded-xl bg-surface border border-border flex flex-col gap-3 shadow-subtle">
          <span className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Key Architecture & Operational Highlights
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-text-secondary">
            {article.introduction.keyTakeaways.map((takeaway, idx) => (
              <div key={idx} className="flex items-start gap-2 bg-surface-raised p-2.5 rounded-lg border border-border">
                <span className="text-emerald-400 font-bold shrink-0">✓</span>
                <span>{takeaway}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 2: Step-by-Step How-To Guide */}
      <section className="flex flex-col gap-5">
        <h2 className="text-xl sm:text-2xl font-bold text-text-primary flex items-center gap-2.5">
          <ListOrdered className="w-5 h-5 text-indigo-400" />
          {article.howToGuide.title}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {article.howToGuide.steps.map((step) => (
            <div key={step.stepNumber} className="bg-surface border border-border rounded-xl p-5 flex flex-col gap-2 shadow-subtle">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-accent/20 text-accent font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  {step.stepNumber}
                </span>
                <h3 className="text-sm font-bold text-text-primary">{step.heading}</h3>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed pl-8">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {article.howToGuide.proTip && (
          <div className="p-4 rounded-xl bg-accent/5 border border-accent/20 flex items-start gap-3 text-xs text-text-secondary">
            <Lightbulb className="w-4 h-4 text-accent shrink-0 mt-0.5" />
            <p><strong className="text-text-primary">{article.howToGuide.proTip}</strong></p>
          </div>
        )}
      </section>

      {/* Section 3: Technical & Mathematical Mechanics */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-text-primary flex items-center gap-2.5">
          <Calculator className="w-5 h-5 text-emerald-400" />
          {article.technicalMechanics.title}
        </h2>
        <p className="text-sm text-text-secondary leading-relaxed">
          {article.technicalMechanics.explanation}
        </p>

        {article.technicalMechanics.formula && (
          <div className="my-1 p-4 rounded-xl bg-surface border border-border font-mono text-xs text-accent">
            <span className="text-text-tertiary block mb-1 uppercase font-semibold text-[10px] tracking-wider">Formula / Algorithm Definition:</span>
            {article.technicalMechanics.formula}
          </div>
        )}

        {article.technicalMechanics.variables && article.technicalMechanics.variables.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {article.technicalMechanics.variables.map((v, idx) => (
              <div key={idx} className="p-2.5 bg-surface-raised border border-border rounded-lg flex items-center gap-2">
                <span className="font-mono font-bold text-accent bg-surface px-2 py-0.5 rounded border border-border shrink-0">
                  {v.symbol}
                </span>
                <span className="text-text-secondary">{v.meaning}</span>
              </div>
            ))}
          </div>
        )}

        {article.technicalMechanics.exampleScenario && (
          <div className="p-4 rounded-xl bg-surface-raised border border-border text-xs text-text-secondary leading-relaxed">
            <span className="text-text-primary font-semibold block mb-1">Worked Practical Example:</span>
            {article.technicalMechanics.exampleScenario}
          </div>
        )}
      </section>

      {/* Section 4: Real-World Use Cases */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-text-primary flex items-center gap-2.5">
          <Layers className="w-5 h-5 text-amber-400" />
          {article.useCases.title}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {article.useCases.cases.map((uc, idx) => (
            <div key={idx} className="bg-surface border border-border rounded-xl p-5 flex flex-col justify-between gap-3 shadow-subtle">
              <div className="flex flex-col gap-1.5">
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wide text-accent">
                  {uc.role}
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {uc.scenario}
                </p>
              </div>
              <div className="pt-2 border-t border-border/50 text-[11px] text-emerald-400 font-medium">
                ★ {uc.benefit}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 5: Comparison Matrix */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-text-primary flex items-center gap-2.5">
          <Table2 className="w-5 h-5 text-purple-400" />
          {article.comparisonMatrix.title}
        </h2>
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface-raised text-text-primary uppercase text-[10px] tracking-wider font-semibold">
                {article.comparisonMatrix.headers.map((h, i) => (
                  <th key={i} className="py-3 px-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-text-secondary">
              {article.comparisonMatrix.rows.map((row, idx) => (
                <tr key={idx} className="hover:bg-surface-raised/50 transition-colors">
                  <td className="py-3 px-4 font-medium text-text-primary">{row.feature}</td>
                  <td className="py-3 px-4 text-emerald-400 font-semibold">{row.toolVerse}</td>
                  <td className="py-3 px-4 text-rose-300">{row.traditional}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 6: Best Practices & Pitfalls */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-text-primary flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-blue-400" />
          {article.bestPractices.title}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-surface border border-border rounded-xl p-5 flex flex-col gap-3">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Recommended Best Practices
            </span>
            <ul className="flex flex-col gap-2 text-xs text-text-secondary">
              {article.bestPractices.dos.map((d, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold shrink-0">✓</span>
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-surface border border-border rounded-xl p-5 flex flex-col gap-3">
            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" /> Pitfalls to Avoid
            </span>
            <ul className="flex flex-col gap-2 text-xs text-text-secondary">
              {article.bestPractices.donts.map((d, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold shrink-0">✕</span>
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Section 7: Extended FAQ Accordion */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-text-primary flex items-center gap-2.5">
          <HelpCircle className="w-5 h-5 text-indigo-400" />
          Frequently Asked Questions (FAQ)
        </h2>

        <div className="flex flex-col gap-2.5">
          {article.faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="bg-surface border border-border rounded-xl overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between p-4 text-left font-semibold text-sm text-text-primary hover:bg-surface-raised transition-colors gap-3"
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-text-tertiary transition-transform duration-200 shrink-0 ${
                      isOpen ? "rotate-180 text-accent" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 text-xs text-text-secondary leading-relaxed border-t border-border/40 pt-3 bg-surface/50">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </article>
  );
};
