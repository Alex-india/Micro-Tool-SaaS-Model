import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { BackButton } from "@/components/ui/BackButton";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  showBackButton?: boolean;
  fallbackHref?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  showBackButton = true,
  fallbackHref,
}) => {
  // Find the most appropriate fallback URL from the second-to-last item or first item
  const calculatedFallback =
    fallbackHref ||
    (items.length > 1 && items[items.length - 2]?.href) ||
    items[0]?.href ||
    "/tools";

  return (
    <div className="flex items-center justify-between gap-3 flex-wrap py-2 border-b border-border/40 mb-1">
      <div className="flex items-center gap-2.5 flex-wrap">
        {showBackButton && (
          <div className="flex items-center gap-2">
            <BackButton fallbackHref={calculatedFallback} label="Back" variant="outline" size="sm" />
            <div className="h-4 w-px bg-border hidden sm:block" />
          </div>
        )}

        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-text-tertiary flex-wrap">
          <Link
            href="/"
            className="flex items-center gap-1 hover:text-text-primary transition-colors font-medium"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Home</span>
          </Link>
          {items.map((item, index) => (
            <React.Fragment key={index}>
              <ChevronRight className="w-3.5 h-3.5 text-text-tertiary/60 shrink-0" />
              {item.href ? (
                <Link
                  href={item.href}
                  className="hover:text-text-primary transition-colors font-medium truncate max-w-[120px] sm:max-w-none"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-text-secondary font-semibold truncate max-w-[160px] sm:max-w-none">
                  {item.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      <Link
        href="/tools"
        className="hidden md:inline-flex items-center text-[11px] font-bold text-accent hover:underline"
      >
        All Tools Directory →
      </Link>
    </div>
  );
};

