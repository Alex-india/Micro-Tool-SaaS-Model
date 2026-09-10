export type ToolCategory =
  | "finance"
  | "pdf"
  | "image"
  | "video"
  | "text"
  | "developer"
  | "web"
  | "student"
  | "calculators"
  | "business"
  | "privacy"
  | "converters"
  | "creator";

export type PlanType = "free" | "freemium" | "premium";

export interface ToolMeta {
  slug: string;
  name: string;
  category: ToolCategory;
  path: string;
  description: string;
  longDescription?: string;
  icon: string;
  plan: PlanType;
  tags: string[];
  isNew?: boolean;
  isPopular?: boolean;
  related: string[];
  metaTitle: string;
  metaDescription: string;
  faq?: Array<{ question: string; answer: string }>;
  formulaText?: string;
  exampleCalculation?: string;
}

export interface CategoryMeta {
  slug: ToolCategory;
  name: string;
  description: string;
  icon: string;
  color: string;
}
