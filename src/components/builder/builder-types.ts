export type BuilderComponentType =
  | "hero"
  | "headline"
  | "text"
  | "cta-button"
  | "image"
  | "steps"
  | "payment-methods"
  | "spacer"
  | "testimonial"
  | "countdown"
  | "features"
  | "divider"
  | "video"
  | "logo-bar"
  | "faq";

export interface BuilderComponent {
  id: string;
  type: BuilderComponentType;
  props: Record<string, unknown>;
}

export interface BuilderPageData {
  components: BuilderComponent[];
  globalStyles: {
    backgroundColor: string;
    fontFamily: string;
    maxWidth: number;
    textColor: string;
    accentColor: string;
  };
}

export interface ComponentDefinition {
  type: BuilderComponentType;
  label: string;
  icon: string;
  category: "layout" | "content" | "conversion" | "social-proof";
  defaultProps: Record<string, unknown>;
  propsSchema: PropField[];
}

export interface PropField {
  key: string;
  label: string;
  type: "text" | "textarea" | "color" | "number" | "url" | "select" | "list" | "toggle" | "range";
  options?: { label: string; value: string }[];
  min?: number;
  max?: number;
  step?: number;
}

// ─── Component Definitions ───────────────────────────────────────

export const COMPONENT_DEFINITIONS: ComponentDefinition[] = [
  {
    type: "hero",
    label: "Hero Section",
    icon: "🖼️",
    category: "layout",
    defaultProps: {
      backgroundImage: "",
      backgroundColor: "#1a1a2e",
      gradientOverlay: true,
      height: 400,
      alignment: "center",
    },
    propsSchema: [
      { key: "backgroundImage", label: "Background Image URL", type: "url" },
      { key: "backgroundColor", label: "Background Color", type: "color" },
      { key: "gradientOverlay", label: "Gradient Overlay", type: "toggle" },
      { key: "height", label: "Height (px)", type: "range", min: 200, max: 800, step: 50 },
      { key: "alignment", label: "Alignment", type: "select", options: [
        { label: "Left", value: "left" }, { label: "Center", value: "center" }, { label: "Right", value: "right" },
      ]},
    ],
  },
  {
    type: "headline",
    label: "Headline",
    icon: "📝",
    category: "content",
    defaultProps: {
      text: "Your Headline Here",
      fontSize: 48,
      fontWeight: "800",
      color: "#ffffff",
      alignment: "center",
      gradientText: false,
      gradientFrom: "#FFD700",
      gradientTo: "#FFA500",
      marginTop: 0,
      marginBottom: 16,
    },
    propsSchema: [
      { key: "text", label: "Text", type: "textarea" },
      { key: "fontSize", label: "Font Size", type: "range", min: 16, max: 96, step: 2 },
      { key: "fontWeight", label: "Weight", type: "select", options: [
        { label: "Normal", value: "400" }, { label: "Medium", value: "500" },
        { label: "Semi Bold", value: "600" }, { label: "Bold", value: "700" },
        { label: "Extra Bold", value: "800" },
      ]},
      { key: "color", label: "Color", type: "color" },
      { key: "alignment", label: "Alignment", type: "select", options: [
        { label: "Left", value: "left" }, { label: "Center", value: "center" }, { label: "Right", value: "right" },
      ]},
      { key: "gradientText", label: "Gradient Text", type: "toggle" },
      { key: "gradientFrom", label: "Gradient From", type: "color" },
      { key: "gradientTo", label: "Gradient To", type: "color" },
      { key: "marginTop", label: "Margin Top", type: "range", min: 0, max: 80, step: 4 },
      { key: "marginBottom", label: "Margin Bottom", type: "range", min: 0, max: 80, step: 4 },
    ],
  },
  {
    type: "text",
    label: "Text Block",
    icon: "📄",
    category: "content",
    defaultProps: {
      text: "Add your description text here. You can write multiple paragraphs.",
      fontSize: 16,
      color: "#cccccc",
      alignment: "center",
      lineHeight: 1.6,
      maxWidth: 600,
      marginTop: 0,
      marginBottom: 16,
    },
    propsSchema: [
      { key: "text", label: "Text", type: "textarea" },
      { key: "fontSize", label: "Font Size", type: "range", min: 12, max: 32, step: 1 },
      { key: "color", label: "Color", type: "color" },
      { key: "alignment", label: "Alignment", type: "select", options: [
        { label: "Left", value: "left" }, { label: "Center", value: "center" }, { label: "Right", value: "right" },
      ]},
      { key: "lineHeight", label: "Line Height", type: "range", min: 1, max: 2.5, step: 0.1 },
      { key: "maxWidth", label: "Max Width (px)", type: "range", min: 200, max: 1000, step: 50 },
      { key: "marginTop", label: "Margin Top", type: "range", min: 0, max: 80, step: 4 },
      { key: "marginBottom", label: "Margin Bottom", type: "range", min: 0, max: 80, step: 4 },
    ],
  },
  {
    type: "cta-button",
    label: "CTA Button",
    icon: "🔘",
    category: "conversion",
    defaultProps: {
      text: "Şimdi Katıl",
      subtext: "Sadece 2 dk sürecek",
      url: "",
      backgroundColor: "#00ca6b",
      textColor: "#ffffff",
      fontSize: 20,
      borderRadius: 12,
      paddingX: 48,
      paddingY: 18,
      fullWidth: false,
      shadow: true,
      alignment: "center",
      marginTop: 8,
      marginBottom: 8,
    },
    propsSchema: [
      { key: "text", label: "Button Text", type: "text" },
      { key: "subtext", label: "Sub Text", type: "text" },
      { key: "url", label: "URL (leave empty for tracked CTA)", type: "url" },
      { key: "backgroundColor", label: "Background Color", type: "color" },
      { key: "textColor", label: "Text Color", type: "color" },
      { key: "fontSize", label: "Font Size", type: "range", min: 14, max: 32, step: 1 },
      { key: "borderRadius", label: "Border Radius", type: "range", min: 0, max: 50, step: 2 },
      { key: "paddingX", label: "Horizontal Padding", type: "range", min: 16, max: 80, step: 4 },
      { key: "paddingY", label: "Vertical Padding", type: "range", min: 8, max: 32, step: 2 },
      { key: "fullWidth", label: "Full Width", type: "toggle" },
      { key: "shadow", label: "Box Shadow", type: "toggle" },
      { key: "alignment", label: "Alignment", type: "select", options: [
        { label: "Left", value: "left" }, { label: "Center", value: "center" }, { label: "Right", value: "right" },
      ]},
      { key: "marginTop", label: "Margin Top", type: "range", min: 0, max: 80, step: 4 },
      { key: "marginBottom", label: "Margin Bottom", type: "range", min: 0, max: 80, step: 4 },
    ],
  },
  {
    type: "image",
    label: "Image",
    icon: "🖼️",
    category: "content",
    defaultProps: {
      src: "",
      alt: "Image",
      maxWidth: 400,
      borderRadius: 12,
      alignment: "center",
      marginTop: 8,
      marginBottom: 8,
    },
    propsSchema: [
      { key: "src", label: "Image URL", type: "url" },
      { key: "alt", label: "Alt Text", type: "text" },
      { key: "maxWidth", label: "Max Width (px)", type: "range", min: 100, max: 800, step: 50 },
      { key: "borderRadius", label: "Border Radius", type: "range", min: 0, max: 50, step: 2 },
      { key: "alignment", label: "Alignment", type: "select", options: [
        { label: "Left", value: "left" }, { label: "Center", value: "center" }, { label: "Right", value: "right" },
      ]},
      { key: "marginTop", label: "Margin Top", type: "range", min: 0, max: 80, step: 4 },
      { key: "marginBottom", label: "Margin Bottom", type: "range", min: 0, max: 80, step: 4 },
    ],
  },
  {
    type: "steps",
    label: "Steps Bar",
    icon: "🔢",
    category: "content",
    defaultProps: {
      items: ["Kayıt Ol", "Para Yatır", "Kazan"],
      accentColor: "#00ca6b",
      textColor: "#cccccc",
      stepNumberColor: "#ffffff",
      showConnectors: true,
      marginTop: 16,
      marginBottom: 16,
    },
    propsSchema: [
      { key: "items", label: "Steps (one per line)", type: "list" },
      { key: "accentColor", label: "Accent Color", type: "color" },
      { key: "textColor", label: "Text Color", type: "color" },
      { key: "stepNumberColor", label: "Step Number Color", type: "color" },
      { key: "showConnectors", label: "Show Connectors", type: "toggle" },
      { key: "marginTop", label: "Margin Top", type: "range", min: 0, max: 80, step: 4 },
      { key: "marginBottom", label: "Margin Bottom", type: "range", min: 0, max: 80, step: 4 },
    ],
  },
  {
    type: "payment-methods",
    label: "Payment Methods",
    icon: "💳",
    category: "content",
    defaultProps: {
      items: ["Papara", "PayFix", "Kredi Kartı", "EFT"],
      backgroundColor: "#3A3839",
      textColor: "#cccccc",
      borderRadius: 8,
      marginTop: 16,
      marginBottom: 16,
    },
    propsSchema: [
      { key: "items", label: "Methods (one per line)", type: "list" },
      { key: "backgroundColor", label: "Badge Background", type: "color" },
      { key: "textColor", label: "Text Color", type: "color" },
      { key: "borderRadius", label: "Border Radius", type: "range", min: 0, max: 24, step: 2 },
      { key: "marginTop", label: "Margin Top", type: "range", min: 0, max: 80, step: 4 },
      { key: "marginBottom", label: "Margin Bottom", type: "range", min: 0, max: 80, step: 4 },
    ],
  },
  {
    type: "spacer",
    label: "Spacer",
    icon: "↕️",
    category: "layout",
    defaultProps: {
      height: 40,
    },
    propsSchema: [
      { key: "height", label: "Height (px)", type: "range", min: 8, max: 200, step: 8 },
    ],
  },
  {
    type: "divider",
    label: "Divider",
    icon: "➖",
    category: "layout",
    defaultProps: {
      color: "#3a3839",
      thickness: 1,
      width: 100,
      marginTop: 16,
      marginBottom: 16,
    },
    propsSchema: [
      { key: "color", label: "Color", type: "color" },
      { key: "thickness", label: "Thickness (px)", type: "range", min: 1, max: 8, step: 1 },
      { key: "width", label: "Width (%)", type: "range", min: 20, max: 100, step: 5 },
      { key: "marginTop", label: "Margin Top", type: "range", min: 0, max: 80, step: 4 },
      { key: "marginBottom", label: "Margin Bottom", type: "range", min: 0, max: 80, step: 4 },
    ],
  },
  {
    type: "testimonial",
    label: "Testimonial",
    icon: "💬",
    category: "social-proof",
    defaultProps: {
      quote: "Bu siteyi kullandığımdan beri çok memnunum!",
      author: "Mehmet Y.",
      rating: 5,
      backgroundColor: "rgba(255,255,255,0.05)",
      textColor: "#e0e0e0",
      authorColor: "#8888aa",
      borderRadius: 12,
      marginTop: 8,
      marginBottom: 8,
    },
    propsSchema: [
      { key: "quote", label: "Quote", type: "textarea" },
      { key: "author", label: "Author", type: "text" },
      { key: "rating", label: "Stars (0-5)", type: "range", min: 0, max: 5, step: 1 },
      { key: "backgroundColor", label: "Background", type: "color" },
      { key: "textColor", label: "Text Color", type: "color" },
      { key: "authorColor", label: "Author Color", type: "color" },
      { key: "borderRadius", label: "Border Radius", type: "range", min: 0, max: 24, step: 2 },
      { key: "marginTop", label: "Margin Top", type: "range", min: 0, max: 80, step: 4 },
      { key: "marginBottom", label: "Margin Bottom", type: "range", min: 0, max: 80, step: 4 },
    ],
  },
  {
    type: "countdown",
    label: "Countdown Timer",
    icon: "⏱️",
    category: "conversion",
    defaultProps: {
      label: "Teklif sona eriyor:",
      hours: 2,
      minutes: 30,
      seconds: 0,
      backgroundColor: "rgba(255,0,0,0.1)",
      textColor: "#ff6b6b",
      labelColor: "#ffffff",
      borderRadius: 12,
      marginTop: 8,
      marginBottom: 8,
    },
    propsSchema: [
      { key: "label", label: "Label", type: "text" },
      { key: "hours", label: "Hours", type: "number", min: 0, max: 99 },
      { key: "minutes", label: "Minutes", type: "number", min: 0, max: 59 },
      { key: "seconds", label: "Seconds", type: "number", min: 0, max: 59 },
      { key: "backgroundColor", label: "Background", type: "color" },
      { key: "textColor", label: "Number Color", type: "color" },
      { key: "labelColor", label: "Label Color", type: "color" },
      { key: "borderRadius", label: "Border Radius", type: "range", min: 0, max: 24, step: 2 },
      { key: "marginTop", label: "Margin Top", type: "range", min: 0, max: 80, step: 4 },
      { key: "marginBottom", label: "Margin Bottom", type: "range", min: 0, max: 80, step: 4 },
    ],
  },
  {
    type: "features",
    label: "Features Grid",
    icon: "✨",
    category: "content",
    defaultProps: {
      items: [
        { icon: "🎰", title: "Slot Oyunları", desc: "500+ slot oyunu" },
        { icon: "🃏", title: "Canlı Casino", desc: "Gerçek krupiyerler" },
        { icon: "⚡", title: "Hızlı Çekim", desc: "24 saat içinde" },
      ],
      columns: 3,
      backgroundColor: "rgba(255,255,255,0.03)",
      textColor: "#ffffff",
      descColor: "#888888",
      borderRadius: 12,
      marginTop: 16,
      marginBottom: 16,
    },
    propsSchema: [
      { key: "columns", label: "Columns", type: "range", min: 1, max: 4, step: 1 },
      { key: "backgroundColor", label: "Card Background", type: "color" },
      { key: "textColor", label: "Title Color", type: "color" },
      { key: "descColor", label: "Description Color", type: "color" },
      { key: "borderRadius", label: "Border Radius", type: "range", min: 0, max: 24, step: 2 },
      { key: "marginTop", label: "Margin Top", type: "range", min: 0, max: 80, step: 4 },
      { key: "marginBottom", label: "Margin Bottom", type: "range", min: 0, max: 80, step: 4 },
    ],
  },
  {
    type: "video",
    label: "Video Embed",
    icon: "🎬",
    category: "content",
    defaultProps: {
      embedUrl: "",
      aspectRatio: "16/9",
      maxWidth: 600,
      borderRadius: 12,
      alignment: "center",
      marginTop: 16,
      marginBottom: 16,
    },
    propsSchema: [
      { key: "embedUrl", label: "Embed URL (YouTube/Vimeo)", type: "url" },
      { key: "aspectRatio", label: "Aspect Ratio", type: "select", options: [
        { label: "16:9", value: "16/9" }, { label: "4:3", value: "4/3" }, { label: "1:1", value: "1/1" },
      ]},
      { key: "maxWidth", label: "Max Width (px)", type: "range", min: 200, max: 800, step: 50 },
      { key: "borderRadius", label: "Border Radius", type: "range", min: 0, max: 24, step: 2 },
      { key: "alignment", label: "Alignment", type: "select", options: [
        { label: "Left", value: "left" }, { label: "Center", value: "center" }, { label: "Right", value: "right" },
      ]},
      { key: "marginTop", label: "Margin Top", type: "range", min: 0, max: 80, step: 4 },
      { key: "marginBottom", label: "Margin Bottom", type: "range", min: 0, max: 80, step: 4 },
    ],
  },
  {
    type: "logo-bar",
    label: "Logo / Icon Bar",
    icon: "🏢",
    category: "content",
    defaultProps: {
      items: [
        { src: "", label: "Brand 1" },
        { src: "", label: "Brand 2" },
        { src: "", label: "Brand 3" },
      ],
      gap: 24,
      opacity: 0.7,
      maxLogoHeight: 40,
      marginTop: 16,
      marginBottom: 16,
    },
    propsSchema: [
      { key: "gap", label: "Gap (px)", type: "range", min: 8, max: 64, step: 4 },
      { key: "opacity", label: "Opacity", type: "range", min: 0.1, max: 1, step: 0.1 },
      { key: "maxLogoHeight", label: "Max Logo Height", type: "range", min: 20, max: 100, step: 5 },
      { key: "marginTop", label: "Margin Top", type: "range", min: 0, max: 80, step: 4 },
      { key: "marginBottom", label: "Margin Bottom", type: "range", min: 0, max: 80, step: 4 },
    ],
  },
  {
    type: "faq",
    label: "FAQ Accordion",
    icon: "❓",
    category: "content",
    defaultProps: {
      items: [
        { question: "Nasıl kayıt olurum?", answer: "Kayıt Ol butonuna tıklayarak 2 dakikada üye olabilirsiniz." },
        { question: "Minimum yatırım ne kadar?", answer: "Minimum yatırım tutarı 100₺'dir." },
      ],
      backgroundColor: "rgba(255,255,255,0.03)",
      questionColor: "#ffffff",
      answerColor: "#aaaaaa",
      borderRadius: 8,
      marginTop: 16,
      marginBottom: 16,
    },
    propsSchema: [
      { key: "backgroundColor", label: "Background", type: "color" },
      { key: "questionColor", label: "Question Color", type: "color" },
      { key: "answerColor", label: "Answer Color", type: "color" },
      { key: "borderRadius", label: "Border Radius", type: "range", min: 0, max: 24, step: 2 },
      { key: "marginTop", label: "Margin Top", type: "range", min: 0, max: 80, step: 4 },
      { key: "marginBottom", label: "Margin Bottom", type: "range", min: 0, max: 80, step: 4 },
    ],
  },
];

export function getDefaultPageData(): BuilderPageData {
  return {
    components: [],
    globalStyles: {
      backgroundColor: "#2d2a2b",
      fontFamily: "'Inter', sans-serif",
      maxWidth: 480,
      textColor: "#ffffff",
      accentColor: "#00ca6b",
    },
  };
}

export function getComponentDefinition(type: BuilderComponentType): ComponentDefinition | undefined {
  return COMPONENT_DEFINITIONS.find((d) => d.type === type);
}
