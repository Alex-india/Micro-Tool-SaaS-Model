import React from "react";
import { Badge } from "@/components/ui/Badge";
import { ToolIcon } from "@/components/ui/ToolIcon";
import { ToolMeta } from "@/lib/types";

export interface ToolHeaderProps {
  tool: ToolMeta;
}

export const ToolHeader: React.FC<ToolHeaderProps> = ({ tool }) => {
  return (
    <div className="flex flex-col gap-2.5 pb-5 border-b border-border mb-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-surface-raised border border-border flex items-center justify-center text-accent">
            <ToolIcon name={tool.icon} className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
              {tool.name}
            </h1>
            <span className="text-[11px] font-mono text-text-tertiary">
              {tool.path}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={tool.plan === "free" ? "free" : tool.plan === "premium" ? "premium" : "freemium"}>
            {tool.plan === "premium" ? "Pro" : tool.plan === "freemium" ? "Freemium" : "Free"}
          </Badge>
          {tool.isPopular && <Badge variant="popular">Popular</Badge>}
          {tool.isNew && <Badge variant="new">New</Badge>}
        </div>
      </div>

      <p className="text-xs sm:text-sm text-text-secondary max-w-3xl leading-relaxed">
        {tool.description}
      </p>
    </div>
  );
};

