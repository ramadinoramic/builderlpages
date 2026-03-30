export interface Campaign {
  id: string;
  name: string;
  slug: string;
  status: "draft" | "active" | "paused" | "archived";
  template: string;
  geo: string | null;
  operator: string | null;
  traffic_source: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Variant {
  id: string;
  campaign_id: string;
  name: string;
  traffic_weight: number;
  is_control: boolean;
  status: "active" | "paused";
  headline: string | null;
  subheadline: string | null;
  cta_text: string | null;
  cta_subtext: string | null;
  cta_color: string;
  cta_url: string | null;
  hero_image_url: string | null;
  body_text: string | null;
  steps: string[];
  payment_methods: string[];
  custom_css: string | null;
  custom_fields: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Click {
  id: string;
  click_id: string;
  campaign_id: string;
  variant_id: string;
  ip: string | null;
  user_agent: string | null;
  referer: string | null;
  geo_country: string | null;
  geo_city: string | null;
  created_at: string;
}

export interface Conversion {
  id: string;
  click_id: string;
  campaign_id: string;
  variant_id: string;
  conversion_type: string;
  payout: number | null;
  currency: string;
  external_id: string | null;
  postback_raw: Record<string, unknown> | null;
  created_at: string;
}

export interface Template {
  id: string;
  name: string;
  description: string | null;
  thumbnail_url: string | null;
  category: "casino" | "sports" | "both";
  editable_fields: EditableField[];
  is_active: boolean;
  created_at: string;
}

export interface EditableField {
  key: string;
  label: string;
  type: "text" | "textarea" | "url" | "color" | "list" | "code";
}

export interface CampaignStats {
  campaign_id: string;
  campaign_name: string;
  status: string;
  variant_id: string;
  variant_name: string;
  traffic_weight: number;
  is_control: boolean;
  clicks: number;
  conversions: number;
  conversion_rate: number;
  total_payout: number;
}

export interface LPTemplateProps {
  variant: {
    headline: string;
    subheadline: string;
    cta_text: string;
    cta_subtext: string;
    cta_color: string;
    cta_url: string;
    hero_image_url?: string;
    body_text?: string;
    steps: string[];
    payment_methods: string[];
    custom_css?: string;
    custom_fields?: Record<string, unknown>;
  };
  campaign: {
    operator: string;
    geo: string;
  };
}
