"use client";

import { type LPTemplateProps } from "@/lib/types";
import { type BuilderPageData, getDefaultPageData } from "@/components/builder/builder-types";
import PageRenderer from "@/components/builder/PageRenderer";

export default function CustomBuilder({ variant }: LPTemplateProps) {
  const builderData = variant.custom_fields?.builder_data as BuilderPageData | undefined;

  if (!builderData || !builderData.components || builderData.components.length === 0) {
    // Fallback: render a simple page with variant data
    const fallbackData: BuilderPageData = {
      ...getDefaultPageData(),
      components: [
        {
          id: "auto-headline",
          type: "headline",
          props: {
            text: variant.headline || "Welcome",
            fontSize: 48,
            fontWeight: "800",
            gradientText: true,
            gradientFrom: "#FFD700",
            gradientTo: "#FFA500",
            alignment: "center",
            marginTop: 40,
            marginBottom: 8,
          },
        },
        {
          id: "auto-subheadline",
          type: "text",
          props: {
            text: variant.subheadline || "",
            fontSize: 18,
            color: "#e0e0e0",
            alignment: "center",
            lineHeight: 1.4,
            maxWidth: 400,
            marginTop: 0,
            marginBottom: 24,
          },
        },
        {
          id: "auto-cta",
          type: "cta-button",
          props: {
            text: variant.cta_text || "Click Here",
            subtext: variant.cta_subtext || "",
            url: "",
            backgroundColor: variant.cta_color || "#00ca6b",
            textColor: "#ffffff",
            fontSize: 20,
            borderRadius: 12,
            paddingX: 48,
            paddingY: 18,
            fullWidth: false,
            shadow: true,
            alignment: "center",
            marginTop: 0,
            marginBottom: 32,
          },
        },
      ],
    };

    return <PageRenderer pageData={fallbackData} ctaUrl={variant.cta_url} />;
  }

  return <PageRenderer pageData={builderData} ctaUrl={variant.cta_url} />;
}
