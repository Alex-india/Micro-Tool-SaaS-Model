import React from "react";
import Link from "next/link";
import { getRelatedTools } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import * as Icons from "lucide-react";

export interface RelatedToolsProps {
  slugs: string[];
}

export const RelatedTools: React.FC<RelatedToolsProps> = ({ slugs }) => {
  const tools = getRelatedTools(slugs);

  if (!tools || tools.length === 0) return null;

  return (
    <div className="mt-12 pt-8 border-t border-border flex flex-col gap-4">
      <h3 className="text-lg font-bold text-text-primary">Related Utilities</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {tools.map((tool) => {
          const IconComp = (Icons as any)[tool.icon] || Icons.Wrench;
          return (
            <Link key={tool.slug} href={tool.path}>
              <Card variant="interactive" className="h-full flex flex-col justify-between p-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                      <IconComp className="w-4 h-4" />
                    </div>
                    <Badge variant={tool.plan === "free" ? "free" : tool.plan === "premium" ? "premium" : "freemium"}>
                      {tool.plan === "premium" ? "Pro" : tool.plan === "freemium" ? "Freemium" : "Free"}
                    </Badge>
                  </div>
                  <h4 className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors">
                    {tool.name}
                  </h4>
                  <p className="text-xs text-text-secondary line-clamp-2">{tool.description}</p>
                </div>
                <span className="text-[11px] font-mono text-accent mt-3 block">Try Tool →</span>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
