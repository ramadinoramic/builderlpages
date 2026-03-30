"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import StatusBadge from "@/components/dashboard/StatusBadge";
import VariantEditor from "@/components/dashboard/VariantEditor";
import TrafficSplitSlider from "@/components/dashboard/TrafficSplitSlider";
import StatsChart from "@/components/dashboard/StatsChart";
import { type Campaign, type Variant, type CampaignStats, type EditableField } from "@/lib/types";
import { Copy, ExternalLink, Plus, Trophy, Paintbrush } from "lucide-react";
import Link from "next/link";

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [stats, setStats] = useState<CampaignStats[]>([]);
  const [dailyData, setDailyData] = useState<Record<string, Record<string, { clicks: number; conversions: number; payout: number }>>>({});
  const [editableFields, setEditableFields] = useState<EditableField[]>([]);
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const supabase = createClient();

    const [campaignRes, variantsRes, statsRes] = await Promise.all([
      supabase.from("campaigns").select("*").eq("id", campaignId).single(),
      supabase.from("variants").select("*").eq("campaign_id", campaignId).order("is_control", { ascending: false }),
      supabase.from("campaign_stats").select("*").eq("campaign_id", campaignId),
    ]);

    if (campaignRes.data) {
      setCampaign(campaignRes.data as Campaign);
      // Load template's editable fields
      const { data: template } = await supabase
        .from("templates")
        .select("editable_fields")
        .eq("id", campaignRes.data.template)
        .single();
      if (template) {
        const fields = typeof template.editable_fields === "string"
          ? JSON.parse(template.editable_fields)
          : template.editable_fields;
        setEditableFields(fields);
      }
    }
    if (variantsRes.data) setVariants(variantsRes.data as Variant[]);
    if (statsRes.data) setStats(statsRes.data as CampaignStats[]);

    // Load daily data
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

  const addVariant = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("variants")
      .insert({
        campaign_id: campaignId,
        name: `Variant ${String.fromCharCode(65 + variants.length)}`,
        traffic_weight: 0,
        is_control: false,
        headline: variants[0]?.headline || "",
        subheadline: variants[0]?.subheadline || "",
        cta_text: variants[0]?.cta_text || "",
        cta_subtext: variants[0]?.cta_subtext || "",
        cta_color: variants[0]?.cta_color || "#00ca6b",
        cta_url: variants[0]?.cta_url || "",
      })
      .select()
      .single();
    if (data) setVariants([...variants, data as Variant]);
  };

  const declareWinner = async (winnerId: string) => {
    const supabase = createClient();
    for (const v of variants) {
      await supabase
        .from("variants")
        .update({
          traffic_weight: v.id === winnerId ? 100 : 0,
          status: v.id === winnerId ? "active" : "paused",
        })
        .eq("id", v.id);
    }
    loadData();
  };

  const duplicateCampaign = async () => {
    if (!campaign) return;
    const supabase = createClient();
    const { data: newCampaign } = await supabase
      .from("campaigns")
      .insert({
        name: `${campaign.name} (Copy)`,
        slug: `${campaign.slug}-copy-${Date.now().toString(36)}`,
        status: "draft",
        template: campaign.template,
        geo: campaign.geo,
        operator: campaign.operator,
        traffic_source: campaign.traffic_source,
        notes: campaign.notes,
      })
      .select()
      .single();

    if (newCampaign) {
      for (const v of variants) {
        await supabase.from("variants").insert({
          campaign_id: newCampaign.id,
          name: v.name,
          traffic_weight: v.traffic_weight,
          is_control: v.is_control,
          headline: v.headline,
          subheadline: v.subheadline,
          cta_text: v.cta_text,
          cta_subtext: v.cta_subtext,
          cta_color: v.cta_color,
          cta_url: v.cta_url,
          hero_image_url: v.hero_image_url,
          body_text: v.body_text,
          steps: v.steps,
          payment_methods: v.payment_methods,
          custom_css: v.custom_css,
          custom_fields: v.custom_fields,
        });
      }
      router.push(`/campaigns/${newCampaign.id}`);
    }
  };

  if (loading) {
    return <div style={{ padding: 48, textAlign: "center", color: "#666688" }}>Loading...</div>;
  }

  if (!campaign) {
    return <div style={{ padding: 48, textAlign: "center", color: "#666688" }}>Campaign not found</div>;
  }

  // Aggregate totals
  const totalClicks = stats.reduce((s, st) => s + Number(st.clicks), 0);
  const totalConversions = stats.reduce((s, st) => s + Number(st.conversions), 0);
  const overallCR = totalClicks > 0 ? Math.round((totalConversions / totalClicks) * 10000) / 100 : 0;
  const totalPayout = stats.reduce((s, st) => s + Number(st.total_payout), 0);

  // Find best performing variant
  const bestVariant = stats.length > 0
    ? stats.reduce((best, s) => Number(s.conversion_rate) > Number(best.conversion_rate) ? s : best)
    : null;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#fff", margin: "0 0 8px" }}>{campaign.name}</h1>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <StatusBadge status={campaign.status} />
            {campaign.geo && <span style={{ padding: "4px 8px", borderRadius: 6, fontSize: 11, background: "#242438", color: "#8888aa" }}>{campaign.geo}</span>}
            {campaign.operator && <span style={{ padding: "4px 8px", borderRadius: 6, fontSize: 11, background: "#242438", color: "#8888aa" }}>{campaign.operator}</span>}
            <span style={{ padding: "4px 8px", borderRadius: 6, fontSize: 11, background: "#242438", color: "#666688" }}>/lp/{campaign.slug}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={toggleStatus} style={{
            padding: "8px 16px", background: campaign.status === "active" ? "#2e2a0a" : "#0a2e1a",
            color: campaign.status === "active" ? "#caa000" : "#00ca6b",
            border: "1px solid " + (campaign.status === "active" ? "#5a4a0a" : "#0a5a2a"),
            borderRadius: 8, fontWeight: 500, fontSize: 13, cursor: "pointer",
          }}>
            {campaign.status === "active" ? "Pause" : "Activate"}
          </button>
          <button onClick={duplicateCampaign} style={{
            padding: "8px 16px", background: "#242438", color: "#8888aa",
            border: "1px solid #2a2a40", borderRadius: 8, fontWeight: 500, fontSize: 13, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <Copy size={14} /> Duplicate
          </button>
          <Link href={`/campaigns/${campaignId}/builder`} style={{
            padding: "8px 16px", background: "linear-gradient(135deg, #00ca6b, #0ea5e9)",
            color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 13,
            textDecoration: "none", display: "flex", alignItems: "center", gap: 6,
          }}>
            <Paintbrush size={14} /> Visual Builder
          </Link>
          <a href={`/lp/${campaign.slug}`} target="_blank" rel="noopener noreferrer" style={{
            padding: "8px 16px", background: "#242438", color: "#8888aa",
            border: "1px solid #2a2a40", borderRadius: 8, fontWeight: 500, fontSize: 13,
            textDecoration: "none", display: "flex", alignItems: "center", gap: 6,
          }}>
            <ExternalLink size={14} /> View LP
          </a>
        </div>
      </div>

      {/* Quick Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Total Clicks", value: totalClicks.toLocaleString() },
          { label: "Total Conversions", value: totalConversions.toLocaleString() },
          { label: "Overall CR", value: `${overallCR}%`, color: "#00ca6b" },
          { label: "Total Payout", value: `$${totalPayout.toLocaleString()}` },
        ].map((s) => (
          <div key={s.label} style={{ background: "#1a1a2e", borderRadius: 10, padding: 14, border: "1px solid #2a2a40" }}>
            <div style={{ fontSize: 11, color: "#666688", marginBottom: 2 }}>{s.label}</div>
            <div className="stat-number" style={{ fontSize: 20, fontWeight: 700, color: s.color || "#fff" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Variants */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16, marginBottom: 24 }}>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: 0 }}>Variants</h2>
            <button onClick={addVariant} style={{
              padding: "6px 12px", background: "#242438", color: "#8888aa",
              border: "1px solid #2a2a40", borderRadius: 6, fontSize: 12, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 4,
            }}>
              <Plus size={14} /> Add Variant
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {variants.map((v) => {
              const vStats = stats.find((s) => s.variant_id === v.id);
              const isWinner = bestVariant && bestVariant.variant_id === v.id && Number(bestVariant.clicks) > 10;
              return (
                <div key={v.id} style={{
                  background: "#1a1a2e", borderRadius: 10, padding: 16,
                  border: `1px solid ${isWinner ? "#00ca6b40" : "#2a2a40"}`,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: 600, color: "#fff", fontSize: 14 }}>{v.name}</span>
                      {v.is_control && <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "#242438", color: "#8888aa" }}>Control</span>}
                      {isWinner && <Trophy size={14} style={{ color: "#00ca6b" }} />}
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => setEditingVariant(v)} style={{
                        padding: "4px 10px", background: "#242438", color: "#8888aa",
                        border: "1px solid #2a2a40", borderRadius: 6, fontSize: 12, cursor: "pointer",
                      }}>
                        Edit
                      </button>
                      <button onClick={() => declareWinner(v.id)} style={{
                        padding: "4px 10px", background: "#0a2e1a", color: "#00ca6b",
                        border: "1px solid #0a5a2a", borderRadius: 6, fontSize: 12, cursor: "pointer",
                      }}>
                        Winner
                      </button>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 11, color: "#666688" }}>Clicks</div>
                      <div className="stat-number" style={{ fontSize: 16, fontWeight: 600, color: "#fff" }}>
                        {Number(vStats?.clicks || 0).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "#666688" }}>Conv.</div>
                      <div className="stat-number" style={{ fontSize: 16, fontWeight: 600, color: "#fff" }}>
                        {Number(vStats?.conversions || 0).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "#666688" }}>CR</div>
                      <div className="stat-number" style={{ fontSize: 16, fontWeight: 600, color: isWinner ? "#00ca6b" : "#fff" }}>
                        {vStats?.conversion_rate || 0}%
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "#666688" }}>Payout</div>
                      <div className="stat-number" style={{ fontSize: 16, fontWeight: 600, color: "#fff" }}>
                        ${Number(vStats?.total_payout || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: 8, fontSize: 12, color: "#666688" }}>
                    {v.headline && <span>&ldquo;{v.headline}&rdquo;</span>}
                    {v.cta_text && <span> &middot; CTA: {v.cta_text}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Traffic Split Sidebar */}
        <div>
          <TrafficSplitSlider
            variants={variants.map((v) => ({ id: v.id, name: v.name, traffic_weight: v.traffic_weight, is_control: v.is_control }))}
            onUpdate={(updated) => {
              setVariants((prev) => prev.map((v) => {
                const u = updated.find((x) => x.id === v.id);
                return u ? { ...v, traffic_weight: u.traffic_weight } : v;
              }));
            }}
          />
        </div>
      </div>

      {/* Charts */}
      <h2 style={{ fontSize: 16, fontWeight: 600, color: "#fff", marginBottom: 12 }}>Performance</h2>
      <StatsChart
        daily={dailyData}
        variants={variants.map((v) => ({ id: v.id, name: v.name }))}
      />

      {/* Variant Editor Drawer */}
      {editingVariant && campaign && (
        <VariantEditor
          variant={editingVariant}
          editableFields={editableFields}
          campaignSlug={campaign.slug}
          onClose={() => setEditingVariant(null)}
          onSave={(updated) => {
            setVariants((prev) => prev.map((v) => v.id === updated.id ? updated : v));
            setEditingVariant(null);
          }}
        />
      )}
    </div>
  );
}
