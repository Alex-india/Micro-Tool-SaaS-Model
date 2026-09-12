import React from "react";
import Link from "next/link";
import { SITE_NAME, SITE_TAGLINE, CATEGORIES, ALL_TOOLS } from "@/lib/constants";
import { Shield, Zap, Lock, LayoutGrid } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-surface border-t border-border mt-16 pt-12 pb-10 text-text-secondary text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 pb-10 border-b border-border">
          {/* Col 1 Brand */}
          <div className="md:col-span-2 flex flex-col gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-accent text-white flex items-center justify-center font-bold text-xs">
                <LayoutGrid className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-text-primary">{SITE_NAME}</span>
            </Link>
            <p className="text-xs text-text-tertiary max-w-sm leading-relaxed">
              Fast, deterministic utilities running securely in your browser. No telemetry trackers, no data logging, 100% private.
            </p>

            <div className="flex items-center gap-4 text-[11px] font-medium text-text-secondary mt-1">
              <span className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-emerald-500" /> Client-Side
              </span>
              <span className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-500" /> Instant Processing
              </span>
              <span className="flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-blue-500" /> Zero Trackers
              </span>
            </div>
          </div>

          {/* Col 2 Top Categories */}
          <div className="flex flex-col gap-2.5">
            <h5 className="text-[11px] font-bold uppercase tracking-wider text-text-primary">Popular Categories</h5>
            <ul className="flex flex-col gap-1.5 text-xs text-text-secondary">
              {CATEGORIES.slice(0, 5).map((cat) => (
                <li key={cat.slug}>
                  <Link href={`/tools?category=${cat.slug}`} prefetch={false} className="hover:text-text-primary transition-colors">
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 More Categories */}
          <div className="flex flex-col gap-2.5">
            <h5 className="text-[11px] font-bold uppercase tracking-wider text-text-primary">More Utilities</h5>
            <ul className="flex flex-col gap-1.5 text-xs text-text-secondary">
              {CATEGORIES.slice(5, 10).map((cat) => (
                <li key={cat.slug}>
                  <Link href={`/tools?category=${cat.slug}`} prefetch={false} className="hover:text-text-primary transition-colors">
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4 Platform */}
          <div className="flex flex-col gap-2.5">
            <h5 className="text-[11px] font-bold uppercase tracking-wider text-text-primary">Navigation</h5>
            <ul className="flex flex-col gap-1.5 text-xs text-text-secondary">
              <li>
                <Link href="/tools" prefetch={false} className="hover:text-text-primary transition-colors">
                  All {ALL_TOOLS.length} Tools
                </Link>
              </li>
              <li>
                <Link href="/pricing" prefetch={false} className="hover:text-text-primary transition-colors">
                  Pricing Plans
                </Link>
              </li>
              <li>
                <Link href="/about" prefetch={false} className="hover:text-text-primary transition-colors">
                  About & Philosophy
                </Link>
              </li>
              <li>
                <Link href="/contact" prefetch={false} className="hover:text-text-primary transition-colors">
                  Contact Support
                </Link>
              </li>
              <li>
                <Link href="/dashboard" prefetch={false} className="hover:text-text-primary transition-colors">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-text-tertiary gap-3">
          <p>© {new Date().getFullYear()} {SITE_NAME}. Free and private tools.</p>
          <div className="flex items-center gap-5">
            <Link href="/privacy" prefetch={false} className="hover:text-text-secondary transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" prefetch={false} className="hover:text-text-secondary transition-colors">
              Terms of Service
            </Link>
            <Link href="/contact" prefetch={false} className="hover:text-text-secondary transition-colors">
              Contact Us
            </Link>
            <Link href="/about" prefetch={false} className="hover:text-text-secondary transition-colors">
              About & Security
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
