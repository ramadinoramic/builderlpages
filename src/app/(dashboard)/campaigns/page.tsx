"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
interface CampaignRow {
  id: string;
  name: string;
  slug: string;
  status: string;
  geo: string | null;
  operator: string | null;
  traffic_source: string | null;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [perCampaign, setPerCampaign] = useState<Record<string, { clicks: number; conversions: number; payout: number }>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    const supabase = createClient();
    const [{ data: c }, { data: s }] = await Promise.all([
      supabase.from("campaigns").select("*").order("updated_at", { ascending: false }),
      supabase.from("campaign_stats").select("*"),
    ]);
    setCampaigns((c || []) as CampaignRow[]);

    const pc: Record<string, { clicks: number; conversions: number; payout: number }> = {};
    for (const st of s || []) {
      if (!pc[st.campaign_id]) pc[st.campaign_id] = { clicks: 0, conversions: 0, payout: 0 };
      pc[st.campaign_id].clicks += Number(st.clicks);
      pc[st.campaign_id].conversions += Number(st.conversions);
      pc[st.campaign_id].payout += Number(st.total_payout);
    }
    setPerCampaign(pc);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === campaigns.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(campaigns.map((c) => c.id)));
    }
  };

  const bulkDelete = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    if (!confirm(`Delete ${ids.length} campaign${ids.length > 1 ? "s" : ""} and all their data? This cannot be undone.`)) return;

    setDeleting(true);
    await fetch("/api/campaigns/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    setSelected(new Set());
    setDeleting(false);
    loadData();
  };

  if (loading) return <div style={{ padding: 40, color: "#6b6b80" }}>Loading...</div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: "#e4e4f0", margin: 0 }}>Campaigns</h1>
          {selected.size > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: "#8b8ba0" }}>{selected.size} selected</span>
              <button onClick={bulkDelete} disabled={deleting} style={{
                padding: "5px 12px", background: "#ef444420", color: "#ef4444",
                border: "1px solid #ef444430", borderRadius: 5, fontSize: 11,
                fontWeight: 500, cursor: "pointer",
              }}>
                {deleting ? "Deleting..." : "Delete Selected"}
              </button>
              <button onClick={() => setSelected(new Set())} style={{
                padding: "5px 10px", background: "transparent", color: "#6b6b80",
                border: "1px solid #1e1e2e", borderRadius: 5, fontSize: 11, cursor: "pointer",
              }}>
                Clear
              </button>
            </div>
          )}
        </div>
        <Link href="/campaigns/new" style={{
          padding: "8px 16px", background: "#6366f1", color: "#fff",
          borderRadius: 6, textDecoration: "none", fontWeight: 500, fontSize: 13,
        }}>
          + New Campaign
        </Link>
      </div>

      <div style={{ background: "#111118", borderRadius: 8, border: "1px solid #1e1e2e", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #1e1e2e" }}>
              <th style={{ padding: "9px 14px", textAlign: "left", width: 32 }}>
                <input
                  type="checkbox"
                  checked={campaigns.length > 0 && selected.size === campaigns.length}
                  onChange={toggleSelectAll}
                  style={{ accentColor: "#6366f1", cursor: "pointer" }}
                />
              </th>
              {["Campaign", "Status", "GEO", "Operator", "Source", "Clicks", "Conv.", "CR", "Revenue"].map((h) => (
                <th key={h} style={{
                  padding: "9px 14px", textAlign: "left", fontSize: 11, fontWeight: 500,
                  color: "#6b6b80", textTransform: "uppercase", letterSpacing: 0.5,
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => {
              const s = perCampaign[c.id] || { clicks: 0, conversions: 0, payout: 0 };
              const cr = s.clicks > 0 ? (s.conversions / s.clicks * 100).toFixed(2) : "0.00";
              const statusColor = c.status === "active" ? "#22c55e" : c.status === "paused" ? "#eab308" : c.status === "draft" ? "#6b6b80" : "#ef4444";
              const isSelected = selected.has(c.id);
              return (
                <tr key={c.id} style={{ borderBottom: "1px solid #1e1e2e", background: isSelected ? "#6366f108" : "transparent" }}>
                  <td style={{ padding: "9px 14px" }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(c.id)}
                      style={{ accentColor: "#6366f1", cursor: "pointer" }}
                    />
                  </td>
                  <td style={{ padding: "9px 14px" }}>
                    <Link href={`/campaigns/${c.id}`} style={{ color: "#e4e4f0", textDecoration: "none", fontSize: 13, fontWeight: 500 }}>
                      {c.name}
                    </Link>
                    <div style={{ fontSize: 10, color: "#555", marginTop: 1 }}>/lp/{c.slug}</div>
                  </td>
                  <td style={{ padding: "9px 14px" }}>
                    <span style={{ fontSize: 11, color: statusColor, fontWeight: 500 }}>{c.status}</span>
                  </td>
                  <td style={{ padding: "9px 14px", fontSize: 12, color: "#8b8ba0" }}>{c.geo || "—"}</td>
                  <td style={{ padding: "9px 14px", fontSize: 12, color: "#8b8ba0" }}>{c.operator || "—"}</td>
                  <td style={{ padding: "9px 14px", fontSize: 12, color: "#8b8ba0" }}>{c.traffic_source || "—"}</td>
                  <td style={{ padding: "9px 14px", fontSize: 13, fontFamily: "monospace", color: "#e4e4f0" }}>{s.clicks.toLocaleString()}</td>
                  <td style={{ padding: "9px 14px", fontSize: 13, fontFamily: "monospace", color: "#e4e4f0" }}>{s.conversions.toLocaleString()}</td>
                  <td style={{ padding: "9px 14px", fontSize: 13, fontFamily: "monospace", color: "#6366f1", fontWeight: 600 }}>{cr}%</td>
                  <td style={{ padding: "9px 14px", fontSize: 13, fontFamily: "monospace", color: "#e4e4f0" }}>${s.payout.toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {campaigns.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: "#6b6b80", fontSize: 13 }}>
            No campaigns yet
          </div>
        )}
      </div>
    </div>
  );
}
