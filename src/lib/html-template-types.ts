export interface HtmlTemplate {
  id: string;
  name: string;
  description: string | null;
  html_content: string;
  css_content: string | null;
  thumbnail_url: string | null;
  editable_regions: EditableRegion[];
  category: "casino" | "sports" | "both";
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EditableRegion {
  id: string;
  selector: string;
  type: "text" | "image" | "link" | "color" | "html" | "background-image";
  label: string;
  defaultValue: string;
}

/**
 * Overrides saved per-variant in custom_fields.html_overrides
 * Maps region id -> new value
 */
export type HtmlOverrides = Record<string, string>;

/**
 * Auto-detect editable regions from HTML by looking for
 * data-editable attributes or common patterns.
 */
export function detectEditableRegions(html: string): EditableRegion[] {
  const regions: EditableRegion[] = [];
  let counter = 0;

  // Match data-editable="label" data-type="text|image|link|etc"
  const dataEditableRegex = /data-editable="([^"]*)"(?:\s+data-type="([^"]*)")?/g;
  let match;
  while ((match = dataEditableRegex.exec(html)) !== null) {
    counter++;
    regions.push({
      id: `region-${counter}`,
      selector: `[data-editable="${match[1]}"]`,
      type: (match[2] as EditableRegion["type"]) || "text",
      label: match[1],
      defaultValue: "",
    });
  }

  // If no data-editable attributes found, auto-detect common elements
  if (regions.length === 0) {
    // We'll detect on the client side where we have DOM access
    return [];
  }

  return regions;
}

/**
 * Apply overrides to HTML content.
 * For each override, find the element by selector and replace its content.
 */
export function applyOverridesToHtml(
  html: string,
  css: string | null,
  overrides: HtmlOverrides,
  regions: EditableRegion[],
  ctaUrl?: string
): string {
  let processedHtml = html;

  // Inject override script that runs client-side to apply changes
  const overrideScript = `
<script>
(function() {
  var overrides = ${JSON.stringify(overrides)};
  var regions = ${JSON.stringify(regions)};
  var ctaUrl = ${JSON.stringify(ctaUrl || "")};

  regions.forEach(function(region) {
    var value = overrides[region.id];
    if (!value && !ctaUrl) return;

    var els = document.querySelectorAll(region.selector);
    els.forEach(function(el) {
      if (value) {
        switch (region.type) {
          case 'text':
          case 'html':
            el.innerHTML = value;
            break;
          case 'image':
            if (el.tagName === 'IMG') el.src = value;
            else el.style.backgroundImage = 'url(' + value + ')';
            break;
          case 'background-image':
            el.style.backgroundImage = 'url(' + value + ')';
            break;
          case 'link':
            if (el.tagName === 'A') el.href = value;
            break;
          case 'color':
            el.style.backgroundColor = value;
            break;
        }
      }
    });
  });

  // Apply CTA URL to all tracked links
  if (ctaUrl) {
    document.querySelectorAll('a[data-cta], a.cta-button, .cta a, [data-editable-type="link"]').forEach(function(el) {
      el.href = ctaUrl;
    });
  }
})();
</script>`;

  // Inject CSS if provided
  const cssBlock = css ? `<style>${css}</style>` : "";

  // Insert before </body> or at the end
  if (processedHtml.includes("</body>")) {
    processedHtml = processedHtml.replace("</body>", `${cssBlock}${overrideScript}</body>`);
  } else {
    processedHtml += `${cssBlock}${overrideScript}`;
  }

  return processedHtml;
}
