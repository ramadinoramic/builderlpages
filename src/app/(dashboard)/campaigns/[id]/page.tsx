"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { type Campaign, type Variant, type CampaignStats, type Lander } from "@/lib/types";
import StatsChart from "@/components/dashboard/StatsChart";

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [stats, setStats] = useState<CampaignStats[]>([]);
  const [dailyData, setDailyData] = useState<Record<string, Record<string, { clicks: number; conversions: number; payout: number }>>>({});
  const [lander, setLander] = useState<Lander | null>(null);
  const [editingVariant, setEditingVariant] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    const supabase = createClient();
    const [cRes, vRes, sRes] = await Promise.all([
      supabase.from("campaigns").select("*").eq("id", campaignId).single(),
      supabase.from("variants").select("*").eq("campaign_id", campaignId).order("is_control", { ascending: false }),
      supabase.from("campaign_stats").select("*").eq("campaign_id", campaignId),
    ]);

    if (cRes.data) {
      setCampaign(cRes.data as Campaign);
      if (cRes.data.lander_id) {
        const { data: l } = await supabase.from("landers").select("*").eq("id", cRes.data.lander_id).single();
        if (l) setLander(l as Lander);
      }
    }
    if (vRes.data) setVariants(vRes.data as Variant[]);
    if (sRes.data) setStats(sRes.data as CampaignStats[]);

    const res = await fetch(`/api/campaigns/${campaignId}/stats`);
    if (res.ok) {
      const data = await res.json();
      setDailyData(data.daily || {});
    }
    setLoading(false);
  }, [campaignId]);

  useEffect(() => { loadData(); }, [loadData]);

  const toggleStatus = async () => {
    if (!campaign) return;
    const supabase = createClient();
    const newStatus = campaign.status === "active" ? "paused" : "active";
    await supabase.from("campaigns").update({ status: newStatus }).eq("id", campaignId);
    setCampaign({ ...campaign, status: newStatus });
  };

  const saveVariant = async (variantId: string) => {
    setSaving(true);
    const supabase = createClient();
    const v = variants.find((x) => x.id === variantId);
    if (!v) return;

    // Separate standard fields from custom variables
    const { CTA_URL, HEADLINE, SUBHEADLINE, CTA_TEXT, CTA_COLOR, HERO_IMAGE, BODY_TEXT } = editValues;

    await supabase.from("variants").update({
      cta_url: CTA_URL ?? v.cta_url,
      headline: HEADLINE ?? v.headline,
      subheadline: SUBHEADLINE ?? v.subheadline,
      cta_text: CTA_TEXT ?? v.cta_text,
      cta_color: CTA_COLOR ?? v.cta_color,
      hero_image_url: HERO_IMAGE ?? v.hero_image_url,
      body_text: BODY_TEXT ?? v.body_text,
      custom_fields: { ...(v.custom_fields as Record<string, string>), ...editValues },
    }).eq("id", variantId);

    setEditingVariant(null);
    setSaving(false);
    loadData();
  };

  const updateWeight = async (variantId: string, weight: number) => {
    const supabase = createClient();
    await supabase.from("variants").update({ traffic_weight: weight }).eq("id", variantId);
    setVariants((prev) => prev.map((v) => v.id === variantId ? { ...v, traffic_weight: weight } : v));
  };

  const addVariant = async () => {
    const supabase = createClient();
    const { data } = await supabase.from("variants").insert({
      campaign_id: campaignId,
      name: `Variant ${String.fromCharCode(65 + variants.length)}`,
      traffic_weight: 0,
      is_control: false,
      custom_fields: lander?.defaults || {},
    }).select().single();
    if (data) setVariants([...variants, data as Variant]);
  };

  const declareWinner = async (winnerId: string) => {
    const supabase = createClient();
    for (const v of variants) {
      await supabase.from("variants").update({
        traffic_weight: v.id === winnerId ? 100 : 0,
        status: v.id === winnerId ? "active" : "paused",
      }).eq("id", v.id);
    }
    loadData();
  };

  const duplicateCampaign = async () => {
    if (!campaign) return;
    const supabase = createClient();
    const { data: nc } = await supabase.from("campaigns").insert({
      name: `${campaign.name} (Copy)`,
      slug: `${campaign.slug}-${Date.now().toString(36)}`,
      status: "draft", template: campaign.template, lander_id: campaign.lander_id,
      geo: campaign.geo, operator: campaign.operator, traffic_source: campaign.traffic_source,
    }).select().single();
    if (nc) {
      for (const v of variants) {
        await supabase.from("variants").insert({
          campaign_id: nc.id, name: v.name, traffic_weight: v.traffic_weight,
          is_control: v.is_control, cta_url: v.cta_url, headline: v.headline,
          subheadline: v.subheadline, cta_text: v.cta_text, cta_color: v.cta_color,
          custom_fields: v.custom_fields,
        });
      }
      router.push(`/campaigns/${nc.id}`);
    }
  };

  if (loading) return <div style={{ padding: 40, color: "#6b6b80" }}>Loading...</div>;
  if (!campaign) return <div style={{ padding: 40, color: "#6b6b80" }}>Campaign not found</div>;

  const totalClicks = stats.reduce((s, st) => s + Number(st.clicks), 0);
  const totalConv = stats.reduce((s, st) => s + Number(st.conversions), 0);
  const totalPayout = stats.reduce((s, st) => s + Number(st.total_payout), 0);
  const overallCR = totalClicks > 0 ? (totalConv / totalClicks * 100).toFixed(2) : "0.00";
  const statusColor = campaign.status === "active" ? "#22c55e" : campaign.status === "paused" ? "#eab308" : "#6b6b80";
  const landerVars = lander?.variables || [];

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <h1 style={{ fontSize: 20, fontWeight: 600, color: "#e4e4f0", margin: 0 }}>{campaign.name}</h1>
            <span style={{ fontSize: 11, color: statusColor, fontWeight: 500, background: `${statusColor}15`, padding: "2px 8px", borderRadius: 4 }}>
              {campaign.status}
            </span>
          </div>
          <div style={{ display: "flex", gap: 8, fontSize: 12, color: "#6b6b80" }}>
            {campaign.geo && <span>{campaign.geo}</span>}
            {campaign.operator && <span>&middot; {campaign.operator}</span>}
            <span>&middot; /lp/{campaign.slug}</span>
            {lander && <span>&middot; Lander: {lander.name}</span>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={toggleStatus} style={{
            padding: "6px 14px", fontSize: 12, borderRadius: 6, cursor: "pointer",
            background: "transparent", color: campaign.status === "active" ? "#eab308" : "#22c55e",
            border: `1px solid ${campaign.status === "active" ? "#eab30830" : "#22c55e30"}`,
          }}>
            {campaign.status === "active" ? "Pause" : "Activate"}
          </button>
          <button onClick={duplicateCampaign} style={{
            padding: "6px 14px", fontSize: 12, borderRadius: 6, cursor: "pointer",
            background: "transparent", color: "#6b6b80", border: "1px solid #1e1e2e",
          }}>
            Duplicate
          </button>
          <a href={`/lp/${campaign.slug}`} target="_blank" rel="noopener noreferrer" style={{
            padding: "6px 14px", fontSize: 12, borderRadius: 6,
            background: "transparent", color: "#6b6b80", border: "1px solid #1e1e2e",
            textDecoration: "none",
          }}>
            Open LP
          </a>
        </div>
      </div>

      {/* Quick stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
        {[
          { label: "Clicks", value: totalClicks.toLocaleString() },
          { label: "Conversions", value: totalConv.toLocaleString() },
          { label: "CR", value: `${overallCR}%`, highlight: true },
          { label: "Revenue", value: `$${totalPayout.toLocaleString()}` },
        ].map((s) => (
          <div key={s.label} style={{ background: "#111118", borderRadius: 8, padding: "10px 14px", border: "1px solid #1e1e2e" }}>
            <div style={{ fontSize: 11, color: "#6b6b80" }}>{s.label}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: s.highlight ? "#6366f1" : "#e4e4f0", fontFamily: "monospace" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Variants */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <h2 style={{ fontSize: 14, fontWeight: 500, color: "#6b6b80", margin: 0 }}>Variants</h2>
        <button onClick={addVariant} style={{
          padding: "5px 12px", background: "#1e1e2e", color: "#8b8ba0",
          border: "none", borderRadius: 4, fontSize: 11, cursor: "pointer",
        }}>
          + Add Variant
        </button>
      </div>

      <div style={{ background: "#111118", borderRadius: 8, border: "1px solid #1e1e2e", overflow: "hidden", marginBottom: 20 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #1e1e2e" }}>
              {["Variant", "Weight", "Clicks", "Conv.", "CR", "Revenue", ""].map((h) => (
                <th key={h} style={{ padding: "8px 14px", textAlign: "left", fontSize: 11, fontWeight: 500, color: "#6b6b80", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {variants.map((v) => {
              const vs = stats.find((s) => s.variant_id === v.id);
              const vCR = vs && Number(vs.clicks) > 0 ? (Number(vs.conversions) / Number(vs.clicks) * 100).toFixed(2) : "0.00";
              return (
                <tr key={v.id} style={{ borderBottom: "1px solid #1e1e2e" }}>
                  <td style={{ padding: "8px 14px" }}>
                    <span style={{ color: "#e4e4f0", fontSize: 13, fontWeight: 500 }}>{v.name}</span>
                    {v.is_control && <span style={{ fontSize: 10, color: "#6b6b80", marginLeft: 6 }}>control</span>}
                  </td>
                  <td style={{ padding: "8px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <input
                        type="range" min={0} max={100}
                        value={v.traffic_weight}
                        onChange={(e) => updateWeight(v.id, parseInt(e.target.value))}
                        style={{ width: 60, accentColor: "#6366f1" }}
                      />
                      <span style={{ fontSize: 12, fontFamily: "monospace", color: "#8b8ba0", minWidth: 28 }}>
                        {v.traffic_weight}%
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: "8px 14px", fontSize: 13, fontFamily: "monospace", color: "#e4e4f0" }}>
                    {Number(vs?.clicks || 0).toLocaleString()}
                  </td>
                  <td style={{ padding: "8px 14px", fontSize: 13, fontFamily: "monospace", color: "#e4e4f0" }}>
                    {Number(vs?.conversions || 0).toLocaleString()}
                  </td>
                  <td style={{ padding: "8px 14px", fontSize: 13, fontFamily: "monospace", color: "#6366f1", fontWeight: 600 }}>
                    {vCR}%
                  </td>
                  <td style={{ padding: "8px 14px", fontSize: 13, fontFamily: "monospace", color: "#e4e4f0" }}>
                    ${Number(vs?.total_payout || 0).toLocaleString()}
                  </td>
                  <td style={{ padding: "8px 14px" }}>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button onClick={() => {
                        setEditingVariant(v.id);
                        setEditValues((v.custom_fields as Record<string, string>) || {});
                      }} style={{
                        padding: "4px 10px", background: "#1e1e2e", color: "#8b8ba0",
                        border: "none", borderRadius: 4, fontSize: 11, cursor: "pointer",
                      }}>
                        Edit
                      </button>
                      <button onClick={() => declareWinner(v.id)} style={{
                        padding: "4px 10px", background: "#6366f115", color: "#6366f1",
                        border: "none", borderRadius: 4, fontSize: 11, cursor: "pointer",
                      }}>
                        Winner
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Edit Variant Modal */}
      {editingVariant && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)" }} onClick={() => setEditingVariant(null)} />
          <div style={{
            position: "relative", width: 520, maxHeight: "80vh", overflowY: "auto",
            background: "#111118", borderRadius: 12, border: "1px solid #1e1e2e", padding: 24,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#e4e4f0", margin: 0 }}>
                Edit: {variants.find((v) => v.id === editingVariant)?.name}
              </h3>
              <button onClick={() => setEditingVariant(null)} style={{ background: "none", border: "none", color: "#6b6b80", cursor: "pointer", fontSize: 16 }}>
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {/* Standard fields always shown */}
              <div>
                <label style={{ fontSize: 11, color: "#6b6b80", display: "block", marginBottom: 3, fontFamily: "monospace" }}>CTA_URL</label>
                <input value={editValues.CTA_URL || ""} onChange={(e) => setEditValues({ ...editValues, CTA_URL: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", background: "#16161e", border: "1px solid #1e1e2e", borderRadius: 6, color: "#e4e4f0", fontSize: 12, boxSizing: "border-box" }}
                  placeholder="https://operator.com/register?btag=..." />
              </div>

              {/* Lander-specific variables */}
              {landerVars.filter((v: string) => v !== "CTA_URL").map((v: string) => (
                <div key={v}>
                  <label style={{ fontSize: 11, color: "#6b6b80", display: "block", marginBottom: 3, fontFamily: "monospace" }}>{`{{${v}}}`}</label>
                  <input
                    value={editValues[v] || ""}
                    onChange={(e) => setEditValues({ ...editValues, [v]: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", background: "#16161e", border: "1px solid #1e1e2e", borderRadius: 6, color: "#e4e4f0", fontSize: 12, boxSizing: "border-box" }}
                    placeholder={lander?.defaults?.[v] || ""}
                  />
                </div>
              ))}

              {landerVars.length === 0 && (
                <p style={{ fontSize: 12, color: "#555" }}>No lander variables. You can still edit CTA URL above.</p>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
              <button onClick={() => setEditingVariant(null)} style={{
                padding: "8px 14px", background: "transparent", color: "#6b6b80",
                border: "1px solid #1e1e2e", borderRadius: 6, fontSize: 12, cursor: "pointer",
              }}>
                Cancel
              </button>
              <button onClick={() => saveVariant(editingVariant)} disabled={saving} style={{
                padding: "8px 18px", background: "#6366f1", color: "#fff",
                border: "none", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: "pointer",
                opacity: saving ? 0.7 : 1,
              }}>
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <h2 style={{ fontSize: 14, fontWeight: 500, color: "#6b6b80", marginBottom: 10 }}>Performance</h2>
      <StatsChart daily={dailyData} variants={variants.map((v) => ({ id: v.id, name: v.name }))} />
    </div>
  );
}
