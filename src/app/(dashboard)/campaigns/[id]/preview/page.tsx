"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { type Campaign, type Variant } from "@/lib/types";

export default function PreviewPage() {
  const params = useParams();
  const campaignId = params.id as string;
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: c } = await supabase.from("campaigns").select("*").eq("id", campaignId).single();
      const { data: v } = await supabase.from("variants").select("*").eq("campaign_id", campaignId).eq("status", "active");
      if (c) setCampaign(c as Campaign);
      if (v) setVariants(v as Variant[]);
    }
    load();
  }, [campaignId]);

  if (!campaign || variants.length === 0) {
    return <div style={{ padding: 48, textAlign: "center", color: "#666688" }}>Loading preview...</div>;
  }

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 16 }}>
        Preview: {campaign.name}
      </h1>
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(${Math.min(variants.length, 3)}, 1fr)`,
        gap: 16,
      }}>
        {variants.map((v) => (
          <div key={v.id} style={{ background: "#1a1a2e", borderRadius: 12, overflow: "hidden", border: "1px solid #2a2a40" }}>
            <div style={{ padding: "8px 12px", borderBottom: "1px solid #2a2a40", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{v.name}</span>
              <span style={{ fontSize: 11, color: "#666688" }}>{v.traffic_weight}%</span>
            </div>
            <iframe
              src={`${baseUrl}/lp/${campaign.slug}?preview=${v.id}`}
              style={{ width: "100%", height: 600, border: "none" }}
              title={v.name}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
