import dynamic from "next/dynamic";
import { type ComponentType } from "react";
import { type LPTemplateProps } from "@/lib/types";

const templates: Record<string, ComponentType<LPTemplateProps>> = {
  "casino-v1": dynamic(() => import("./CasinoV1")),
  "sports-v1": dynamic(() => import("./SportsV1")),
  "casino-v2": dynamic(() => import("./CasinoV2")),
};

export function getTemplateComponent(templateId: string): ComponentType<LPTemplateProps> | null {
  return templates[templateId] ?? null;
}

export function getAvailableTemplates(): string[] {
  return Object.keys(templates);
}
