"use client";

import Link from "next/link";
import StatusBadge from "./StatusBadge";

interface CampaignCardProps {
  campaign: {
    id: string;
    name: string;
    slug: string;
    status: string;
    operator: string | null;
    geo: string | null;
    template: string;
  };
  stats?: {
    clicks: number;
    conversions: number;
    conversion_rate: number;
    total_payout: number;
  };
}

export default function CampaignCard({ campaign, stats }: CampaignCardProps) {
  return (
    <Link
      href={`/campaigns/${campaign.id}`}
      style={{
        display: "block", background: "#1a1a2e", borderRadius: 12,
        padding: 20, border: "1px solid #2a2a40", textDecoration: "none",
        transition: "border-color 0.15s",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>{campaign.name}</h3>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <StatusBadge status={campaign.status} />
            {campaign.geo && (
              <span style={{ padding: "4px 8px", borderRadius: 6, fontSize: 11, background: "#242438", color: "#8888aa" }}>
                {campaign.geo}
              </span>
            )}
            {campaign.operator && (
              <span style={{ padding: "4px 8px", borderRadius: 6, fontSize: 11, background: "#242438", color: "#8888aa" }}>
                {campaign.operator}
              </span>
            )}
          </div>
        </div>
      </div>

      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: "#666688", marginBottom: 2 }}>Clicks</div>
            <div className="stat-number" style={{ fontSize: 18, fontWeight: 600, color: "#fff" }}>
              {stats.clicks.toLocaleString()}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#666688", marginBottom: 2 }}>Conv.</div>
            <div className="stat-number" style={{ fontSize: 18, fontWeight: 600, color: "#fff" }}>
              {stats.conversions.toLocaleString()}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#666688", marginBottom: 2 }}>CR</div>
            <div className="stat-number" style={{ fontSize: 18, fontWeight: 600, color: "#00ca6b" }}>
              {stats.conversion_rate}%
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#666688", marginBottom: 2 }}>Payout</div>
            <div className="stat-number" style={{ fontSize: 18, fontWeight: 600, color: "#fff" }}>
              ${stats.total_payout.toLocaleString()}
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 12, fontSize: 12, color: "#666688" }}>
        /lp/{campaign.slug}
      </div>
    </Link>
  );
}
