"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { type Campaign, type Variant, type CampaignStats, type Lander } from "@/lib/types";
import StatsChart from "@/components/dashboard/StatsChart";
import Link from "next/link";

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [stats, setStats] = useState<CampaignStats[]>([]);
  const [dailyData, setDailyData] = useState<Record<string, Record<string, { clicks: number; conversions: number; payout: number }>>>({});
  const [lander, setLander] = useState<Lander | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit state
  const [editingVariant, setEditingVariant] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCta, setEditCta] = useState("");
  const [editWeight, setEditWeight] = useState(50);
  const [editVars, setEditVars] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Lander swap
  const [changingLander, setChangingLander] = useState(false);
  const [allLanders, setAllLanders] = useState<Lander[]>([]);

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

    try {
      const res = await fetch(`/api/campaigns/${campaignId}/stats`);
      if (res.ok) setDailyData((await res.json()).daily || {});
    } catch {}
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

  const openEditVariant = (v: Variant) => {
    setEditingVariant(v.id);
    setEditName(v.name);
    setEditCta(v.cta_url || "");
    setEditWeight(v.traffic_weight);
    const cf = (v.custom_fields || {}) as Record<string, string>;
    setEditVars({ ...cf });
  };

  const saveVariant = async () => {
    if (!editingVariant) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from("variants").update({
      name: editName,
      cta_url: editCta || null,
      traffic_weight: editWeight,
      custom_fields: { ...editVars, CTA_URL: editCta },
    }).eq("id", editingVariant);
    setEditingVariant(null);
    setSaving(false);
    loadData();
  };

  const addVariant = async () => {
    const supabase = createClient();
    const existing = variants[0];
    const cf = existing ? { ...((existing.custom_fields || {}) as Record<string, string>) } : {};
    const { data } = await supabase.from("variants").insert({
      campaign_id: campaignId,
      name: `Variant ${String.fromCharCode(65 + variants.length)}`,
      traffic_weight: 0,
      is_control: false,
      cta_url: existing?.cta_url || null,
      custom_fields: cf,
    }).select().single();
    if (data) {
      setVariants([...variants, data as Variant]);
      openEditVariant(data as Variant);
    }
  };

  const deleteVariant = async (id: string) => {
    if (variants.length <= 1) return;
    const supabase = createClient();
    await supabase.from("variants").delete().eq("id", id);
    setVariants(variants.filter((v) => v.id !== id));
    if (editingVariant === id) setEditingVariant(null);
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
      name: `${campaign.name} (Copy)`, slug: `${campaign.slug}-${Date.now().toString(36)}`,
      status: "draft", template: null, lander_id: campaign.lander_id,
      geo: campaign.geo, operator: campaign.operator, traffic_source: campaign.traffic_source,
    }).select().single();
    if (nc) {
      for (const v of variants) {
        await supabase.from("variants").insert({
          campaign_id: nc.id, name: v.name, traffic_weight: v.traffic_weight,
          is_control: v.is_control, cta_url: v.cta_url, custom_fields: v.custom_fields,
        });
      }
      router.push(`/campaigns/${nc.id}`);
    }
  };

  const switchLander = async (newLanderId: string) => {
    const supabase = createClient();
    await supabase.from("campaigns").update({ lander_id: newLanderId }).eq("id", campaignId);
    setChangingLander(false);
    loadData();
  };

  if (loading) return <div style={{ padding: 40, color: "#6b6b80" }}>Loading...</div>;
  if (!campaign) return <div style={{ padding: 40, color: "#6b6b80" }}>Campaign not found</div>;

  const totalClicks = stats.reduce((s, st) => s + Number(st.clicks), 0);
  const totalConv = stats.reduce((s, st) => s + Number(st.conversions), 0);
  const totalPayout = stats.reduce((s, st) => s + Number(st.total_payout), 0);
  const overallCR = totalClicks > 0 ? (totalConv / totalClicks * 100).toFixed(2) : "0.00";
  const statusColor = campaign.status === "active" ? "#22c55e" : campaign.status === "paused" ? "#eab308" : "#6b6b80";
  const landerVars = (lander?.variables || []).filter((v: string) => v !== "CTA_URL");

  const input: React.CSSProperties = { width: "100%", padding: "8px 12px", background: "#13131b", border: "1px solid #1e1e2e", borderRadius: 6, color: "#e4e4f0", fontSize: 13, boxSizing: "border-box", outline: "none" };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <h1 style={{ fontSize: 20, fontWeight: 600, color: "#e4e4f0", margin: 0 }}>{campaign.name}</h1>
            <span style={{ fontSize: 11, color: statusColor, fontWeight: 500, background: `${statusColor}15`, padding: "2px 8px", borderRadius: 4 }}>{campaign.status}</span>
          </div>
          <div style={{ display: "flex", gap: 8, fontSize: 12, color: "#6b6b80", flexWrap: "wrap" }}>
            {campaign.geo && <span>{campaign.geo}</span>}
            {campaign.operator && <span>&middot; {campaign.operator}</span>}
            <span>&middot; /lp/{campaign.slug}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button onClick={toggleStatus} style={{ padding: "6px 14px", fontSize: 12, borderRadius: 6, cursor: "pointer", background: "transparent", color: campaign.status === "active" ? "#eab308" : "#22c55e", border: `1px solid ${campaign.status === "active" ? "#eab30830" : "#22c55e30"}` }}>
            {campaign.status === "active" ? "Pause" : "Activate"}
          </button>
          <button onClick={duplicateCampaign} style={{ padding: "6px 14px", fontSize: 12, borderRadius: 6, cursor: "pointer", background: "transparent", color: "#6b6b80", border: "1px solid #1e1e2e" }}>Duplicate</button>
          <a href={`/lp/${campaign.slug}`} target="_blank" rel="noopener noreferrer" style={{ padding: "6px 14px", fontSize: 12, borderRadius: 6, background: "transparent", color: "#6b6b80", border: "1px solid #1e1e2e", textDecoration: "none" }}>Open LP</a>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
        {[
          { label: "Clicks", value: totalClicks.toLocaleString() },
          { label: "Conversions", value: totalConv.toLocaleString() },
          { label: "CR", value: `${overallCR}%`, hl: true },
          { label: "Revenue", value: `$${totalPayout.toLocaleString()}` },
        ].map((s) => (
          <div key={s.label} style={{ background: "#111118", borderRadius: 8, padding: "10px 14px", border: "1px solid #1e1e2e" }}>
            <div style={{ fontSize: 11, color: "#6b6b80" }}>{s.label}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: s.hl ? "#6366f1" : "#e4e4f0", fontFamily: "monospace" }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16, marginBottom: 20 }}>
        {/* Left — Variants */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <h2 style={{ fontSize: 14, fontWeight: 500, color: "#6b6b80", margin: 0 }}>Variants & Traffic Split</h2>
            <button onClick={addVariant} style={{ padding: "5px 12px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 4, fontSize: 11, fontWeight: 500, cursor: "pointer" }}>
              + Add Variant
            </button>
          </div>

          {/* Traffic split bar */}
          {variants.length > 1 && (
            <div style={{ display: "flex", height: 6, borderRadius: 3, overflow: "hidden", marginBottom: 10, gap: 1 }}>
              {variants.map((v, i) => {
                const colors = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"];
                return <div key={v.id} style={{ width: `${v.traffic_weight}%`, background: colors[i % colors.length], transition: "width 0.2s" }} />;
              })}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {variants.map((v, i) => {
              const vs = stats.find((s) => s.variant_id === v.id);
              const vCR = vs && Number(vs.clicks) > 0 ? (Number(vs.conversions) / Number(vs.clicks) * 100).toFixed(2) : "0.00";
              const colors = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"];
              const cf = (v.custom_fields || {}) as Record<string, string>;
              return (
                <div key={v.id} style={{ background: "#111118", borderRadius: 8, border: "1px solid #1e1e2e", padding: "12px 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: colors[i % colors.length] }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#e4e4f0" }}>{v.name}</span>
                      {v.is_control && <span style={{ fontSize: 9, color: "#6b6b80", background: "#1e1e2e", padding: "1px 5px", borderRadius: 3 }}>control</span>}
                      <span style={{ fontSize: 11, fontFamily: "monospace", color: "#8b8ba0" }}>{v.traffic_weight}%</span>
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button onClick={() => openEditVariant(v)} style={{ padding: "3px 10px", background: "#1e1e2e", color: "#8b8ba0", border: "none", borderRadius: 4, fontSize: 11, cursor: "pointer" }}>Edit</button>
                      {variants.length > 1 && <button onClick={() => declareWinner(v.id)} style={{ padding: "3px 10px", background: "#6366f110", color: "#6366f1", border: "none", borderRadius: 4, fontSize: 11, cursor: "pointer" }}>Winner</button>}
                      {variants.length > 1 && !v.is_control && <button onClick={() => deleteVariant(v.id)} style={{ padding: "3px 10px", background: "#ef444410", color: "#ef4444", border: "none", borderRadius: 4, fontSize: 11, cursor: "pointer" }}>Del</button>}
                    </div>
                  </div>

                  {/* Key info row */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: 12, fontSize: 12 }}>
                    <div>
                      <div style={{ color: "#555", fontSize: 10, marginBottom: 1 }}>CTA URL</div>
                      <div style={{ color: v.cta_url ? "#8b8ba0" : "#555", fontFamily: "monospace", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 280 }}>
                        {v.cta_url || "Not set"}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ color: "#555", fontSize: 10 }}>Clicks</div>
                      <div style={{ fontFamily: "monospace", color: "#e4e4f0" }}>{Number(vs?.clicks || 0).toLocaleString()}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ color: "#555", fontSize: 10 }}>Conv</div>
                      <div style={{ fontFamily: "monospace", color: "#e4e4f0" }}>{Number(vs?.conversions || 0).toLocaleString()}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ color: "#555", fontSize: 10 }}>CR</div>
                      <div style={{ fontFamily: "monospace", color: "#6366f1", fontWeight: 600 }}>{vCR}%</div>
                    </div>
                  </div>

                  {/* Show variable overrides if any */}
                  {landerVars.length > 0 && Object.keys(cf).some((k) => k !== "CTA_URL" && cf[k]) && (
                    <div style={{ marginTop: 6, display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {landerVars.filter((vr: string) => cf[vr]).map((vr: string) => (
                        <span key={vr} style={{ fontSize: 10, padding: "1px 6px", background: "#1e1e2e", borderRadius: 3, color: "#6b6b80", fontFamily: "monospace" }}>
                          {vr}={cf[vr]?.substring(0, 20)}{(cf[vr]?.length || 0) > 20 ? "..." : ""}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right — Lander info */}
        <div>
          <div style={{ background: "#111118", borderRadius: 8, border: "1px solid #1e1e2e", padding: 14, marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <h3 style={{ fontSize: 13, fontWeight: 500, color: "#8b8ba0", margin: 0 }}>Lander</h3>
              <button onClick={async () => {
                if (!changingLander) {
                  const supabase = createClient();
                  const { data } = await supabase.from("landers").select("*").eq("is_archived", false).order("name");
                  if (data) setAllLanders(data as Lander[]);
                }
                setChangingLander(!changingLander);
              }} style={{ padding: "3px 8px", background: "#1e1e2e", color: "#8b8ba0", border: "none", borderRadius: 4, fontSize: 10, cursor: "pointer" }}>
                {changingLander ? "Cancel" : "Change"}
              </button>
            </div>

            {changingLander ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {allLanders.map((l) => (
                  <button key={l.id} onClick={() => switchLander(l.id)} style={{
                    padding: "6px 10px", background: l.id === campaign.lander_id ? "#6366f115" : "#16161e",
                    color: l.id === campaign.lander_id ? "#6366f1" : "#8b8ba0",
                    border: `1px solid ${l.id === campaign.lander_id ? "#6366f130" : "#1e1e2e"}`,
                    borderRadius: 4, fontSize: 11, cursor: "pointer", textAlign: "left",
                  }}>
                    {l.name}
                  </button>
                ))}
              </div>
            ) : lander ? (
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "#e4e4f0", marginBottom: 4 }}>{lander.name}</div>
                <div style={{ fontSize: 11, color: "#555", marginBottom: 8 }}>{lander.notes || "—"}</div>
                {landerVars.length > 0 && (
                  <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                    {landerVars.map((v: string) => (
                      <span key={v} style={{ padding: "1px 5px", background: "#1e1e2e", borderRadius: 3, fontSize: 10, color: "#6366f1", fontFamily: "monospace" }}>{v}</span>
                    ))}
                  </div>
                )}
                <Link href={`/landers/${lander.id}`} style={{ display: "block", marginTop: 8, fontSize: 11, color: "#6b6b80", textDecoration: "none" }}>
                  Edit lander HTML &rarr;
                </Link>
              </div>
            ) : (
              <p style={{ fontSize: 12, color: "#555", margin: 0 }}>No lander assigned</p>
            )}
          </div>

          {/* Quick preview */}
          {lander && (
            <div style={{ background: "#111118", borderRadius: 8, border: "1px solid #1e1e2e", overflow: "hidden" }}>
              <div style={{ padding: "6px 12px", borderBottom: "1px solid #1e1e2e", fontSize: 10, color: "#555" }}>Preview</div>
              <iframe srcDoc={lander.html} style={{ width: "100%", height: 300, border: "none", display: "block" }} sandbox="allow-same-origin" title="Preview" />
            </div>
          )}
        </div>
      </div>

      {/* Edit Variant Modal */}
      {editingVariant && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)" }} onClick={() => setEditingVariant(null)} />
          <div style={{ position: "relative", width: 560, maxHeight: "85vh", overflowY: "auto", background: "#111118", borderRadius: 12, border: "1px solid #1e1e2e", padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#e4e4f0", margin: 0 }}>Edit Variant</h3>
              <button onClick={() => setEditingVariant(null)} style={{ background: "none", border: "none", color: "#6b6b80", cursor: "pointer", fontSize: 16 }}>✕</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Variant name + weight */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 100px", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: "#6b6b80", display: "block", marginBottom: 3 }}>Variant Name</label>
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} style={input} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "#6b6b80", display: "block", marginBottom: 3 }}>Weight %</label>
                  <input type="number" min={0} max={100} value={editWeight} onChange={(e) => setEditWeight(parseInt(e.target.value) || 0)} style={{ ...input, textAlign: "center" }} />
                </div>
              </div>

              {/* CTA URL — prominent */}
              <div style={{ background: "#6366f108", border: "1px solid #6366f120", borderRadius: 8, padding: 12 }}>
                <label style={{ fontSize: 12, color: "#6366f1", display: "block", marginBottom: 4, fontWeight: 600 }}>CTA / Offer URL</label>
                <input
                  value={editCta}
                  onChange={(e) => setEditCta(e.target.value)}
                  style={{ ...input, borderColor: "#6366f130" }}
                  placeholder="https://operator.com/register?btag=AFFTAG"
                />
                <p style={{ fontSize: 10, color: "#555", margin: "4px 0 0" }}>
                  Visitors who click the CTA on the lander will be redirected to this URL via click tracking.
                </p>
              </div>

              {/* Lander variable overrides */}
              {landerVars.length > 0 && (
                <div>
                  <label style={{ fontSize: 12, color: "#8b8ba0", display: "block", marginBottom: 6, fontWeight: 500 }}>Lander Variables</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {landerVars.map((v: string) => (
                      <div key={v}>
                        <label style={{ fontSize: 10, color: "#6366f1", fontFamily: "monospace", display: "block", marginBottom: 2 }}>{`{{${v}}}`}</label>
                        <input
                          value={editVars[v] || ""}
                          onChange={(e) => setEditVars({ ...editVars, [v]: e.target.value })}
                          style={{ ...input, fontSize: 12 }}
                          placeholder={lander?.defaults?.[v] || ""}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
              <button onClick={() => setEditingVariant(null)} style={{ padding: "8px 14px", background: "transparent", color: "#6b6b80", border: "1px solid #1e1e2e", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>Cancel</button>
              <button onClick={saveVariant} disabled={saving} style={{ padding: "8px 20px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: "pointer", opacity: saving ? 0.7 : 1 }}>
                {saving ? "Saving..." : "Save Variant"}
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
