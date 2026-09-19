"use client";

import React, { useMemo } from "react";
import { ToolMeta } from "@/lib/types";
import { 
  BookOpen, 
  CheckCircle2, 
  ListOrdered, 
  Lightbulb, 
  Table2, 
  ShieldCheck, 
  AlertCircle 
} from "lucide-react";
import { generateWebApplicationSchema, generateBreadcrumbSchema, generateFAQSchema } from "@/lib/seo";
import { generateToolSEOArticle } from "@/lib/seo-content-engine";

export interface SEOContentProps {
  tool: ToolMeta;
}

export const SEOContent = React.memo<SEOContentProps>(({ tool }) => {
  const article = useMemo(() => generateToolSEOArticle(tool), [tool.slug]);
  const webAppSchema = useMemo(() => generateWebApplicationSchema(tool), [tool.slug]);
  const breadcrumbSchema = useMemo(() => generateBreadcrumbSchema(tool), [tool.slug]);
  const faqSchema = useMemo(() => generateFAQSchema(article.faqs), [article.faqs]);

  return (
    <article
      className="mt-10 sm:mt-16 pt-8 sm:pt-12 border-t border-border flex flex-col gap-8 sm:gap-12 max-w-5xl mx-auto w-full"
      style={{ contentVisibility: "auto", containIntrinsicSize: "900px" }}
    >
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
      <div className="flex items-center justify-between border-b border-border pb-4 gap-2 flex-wrap">
        <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-accent bg-accent/10 px-3 py-1 rounded-full">
          Quick Guide & Overview
        </span>
        <span className="text-[10px] sm:text-[11px] font-medium text-text-tertiary">
          100% Client-Side & Private
        </span>
      </div>

      {/* Section 1: Overview & Definition */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-text-primary flex items-center gap-2.5">
          <BookOpen className="w-5 h-5 text-accent shrink-0" />
          <span>{article.introduction.title}</span>
        </h2>
        <div className="flex flex-col gap-3 text-xs sm:text-sm text-text-secondary leading-relaxed">
          {article.introduction.paragraphs.map((p, idx) => (
            <p key={idx}>{p}</p>
          ))}
        </div>

        {/* Key Takeaways Grid */}
        <div className="mt-3 p-4 sm:p-5 rounded-xl bg-surface border border-border flex flex-col gap-3 shadow-subtle">
          <span className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
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
          <ListOrdered className="w-5 h-5 text-indigo-400 shrink-0" />
          <span>{article.howToGuide.title}</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {article.howToGuide.steps.map((step) => (
            <div key={step.stepNumber} className="bg-surface border border-border rounded-xl p-4 sm:p-5 flex flex-col gap-2 shadow-subtle">
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

      {/* Section 5: Comparison Matrix */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-text-primary flex items-center gap-2.5">
          <Table2 className="w-5 h-5 text-purple-400 shrink-0" />
          <span>{article.comparisonMatrix.title}</span>
        </h2>
        <div className="overflow-x-auto touch-scroll rounded-xl border border-border bg-surface">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface-raised text-text-primary uppercase text-[10px] tracking-wider font-semibold">
                {article.comparisonMatrix.headers.map((h, i) => (
                  <th key={i} className="py-3 px-3.5 sm:px-4 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-text-secondary">
              {article.comparisonMatrix.rows.map((row, idx) => (
                <tr key={idx} className="hover:bg-surface-raised/50 transition-colors">
                  <td className="py-3 px-3.5 sm:px-4 font-medium text-text-primary whitespace-nowrap">{row.feature}</td>
                  <td className="py-3 px-3.5 sm:px-4 text-emerald-400 font-semibold whitespace-nowrap">{row.toolVerse}</td>
                  <td className="py-3 px-3.5 sm:px-4 text-rose-300 whitespace-nowrap">{row.traditional}</td>
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

      {/* Section 6: Pro Tips & Pitfalls */}
    </article>
  );
});

SEOContent.displayName = "SEOContent";

export default SEOContent;
