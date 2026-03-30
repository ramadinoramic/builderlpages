"use client";

import { useEffect, useState } from "react";
import { type LPTemplateProps } from "@/lib/types";
import { type HtmlTemplate, type HtmlOverrides, applyOverridesToHtml } from "@/lib/html-template-types";
import { createClient } from "@/lib/supabase/client";

export default function HtmlTemplateRenderer({ variant }: LPTemplateProps) {
  const [html, setHtml] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const fields = variant.custom_fields || {};
      const templateId = fields.html_template_id as string;
      const overrides = (fields.html_overrides as HtmlOverrides) || {};

      if (!templateId) {
        setHtml("<div style='padding:48px;text-align:center;color:#888;'>No HTML template configured for this variant.</div>");
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const { data: template } = await supabase
        .from("html_templates")
        .select("*")
        .eq("id", templateId)
        .single();

      if (!template) {
        setHtml("<div style='padding:48px;text-align:center;color:#888;'>HTML template not found.</div>");
        setLoading(false);
        return;
      }

      const tmpl = template as HtmlTemplate;
      const processedHtml = applyOverridesToHtml(
        tmpl.html_content,
        tmpl.css_content,
        overrides,
        tmpl.editable_regions || [],
        variant.cta_url
      );

      setHtml(processedHtml);
      setLoading(false);
    }
    load();
  }, [variant]);

  if (loading) {
    return <div style={{ padding: 48, textAlign: "center", color: "#888" }}>Loading...</div>;
  }

  // Render the full HTML page in an iframe for isolation
  return (
    <iframe
      srcDoc={html}
      style={{
        width: "100%",
        height: "100vh",
        border: "none",
        display: "block",
      }}
      title="Landing Page"
      sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
    />
  );
}
