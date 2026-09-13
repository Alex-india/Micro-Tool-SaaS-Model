import { redirect, notFound } from "next/navigation";
import { CATEGORIES } from "@/lib/constants";

interface CategoryPageProps {
  params: {
    category: string;
  };
}

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({
    category: c.slug,
  }));
}

export const dynamicParams = false;

export default function CategoryPage({ params }: CategoryPageProps) {
  const category = CATEGORIES.find((c) => c.slug === params.category);
  if (!category) {
    notFound();
  }

  redirect(`/tools?category=${category.slug}`);
}
