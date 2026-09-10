import { ToolMeta } from "./types";
import { SITE_NAME } from "./constants";

export function generateWebApplicationSchema(tool: ToolMeta, domain: string = "https://toolverse.app") {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": tool.name,
    "url": `${domain}${tool.path}`,
    "applicationCategory": "UtilityApplication",
    "operatingSystem": "Any",
    "browserRequirements": "Requires JavaScript. Requires HTML5.",
    "description": tool.description,
    "offers": {
      "@type": "Offer",
      "price": tool.plan === "premium" ? "149" : "0",
      "priceCurrency": "INR",
    },
    "provider": {
      "@type": "Organization",
      "name": SITE_NAME,
      "url": domain,
    },
  };
}

export function generateBreadcrumbSchema(tool: ToolMeta, domain: string = "https://toolverse.app") {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": domain,
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": tool.category.toUpperCase(),
        "item": `${domain}/tools?category=${tool.category}`,
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": tool.name,
        "item": `${domain}${tool.path}`,
      },
    ],
  };
}

export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((f) => ({
      "@type": "Question",
      "name": f.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": f.answer,
      },
    })),
  };
}
