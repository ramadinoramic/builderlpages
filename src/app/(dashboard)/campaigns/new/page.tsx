"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { type Lander } from "@/lib/types";

export default function NewCampaignPage() {
  const router = useRouter();
  const [landers, setLanders] = useState<Lander[]>([]);
  const [saving, setSaving] = useState(false);
  const [previewLander, setPreviewLander] = useState<Lander | null>(null);

  // Campaign fields
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [operator, setOperator] = useState("");
  const [geo, setGeo] = useState("");
  const [source, setSource] = useState("");
  const [landerId, setLanderId] = useState<string | null>(null);
  const [ctaUrls, setCtaUrls] = useState<string[]>([""]);
  const [overrides, setOverrides] = useState<Record<string, string>>({});

  const selectedLander = landers.find((l) => l.id === landerId);
  const variables = (selectedLander?.variables || []).filter((v: string) => v !== "CTA_URL" && v !== "CTA_URLS");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.from("landers").select("*").eq("is_archived", false).order("name");
      if (data) setLanders(data as Lander[]);
    }
    load();
  }, []);

  useEffect(() => {
    setSlug(name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
  }, [name]);

  useEffect(() => {
    if (selectedLander?.defaults) {
      setOverrides({ ...selectedLander.defaults });
    }
  }, [landerId, selectedLander?.defaults]);

  const handleCreate = async (activate: boolean) => {
    if (!name || !slug || !landerId) return;
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: campaign, error } = await supabase.from("campaigns").insert({
      name, slug, operator: operator || null, geo: geo || null,
      traffic_source: source || null, template: null,
      lander_id: landerId, status: activate ? "active" : "draft",
      created_by: user?.id || null,
    }).select("id").single();

    if (error || !campaign) {
      alert("Error: " + (error?.message || "Unknown"));
      setSaving(false);
      return;
    }

    // Create single default variant with the CTA + overrides
    await supabase.from("variants").insert({
      campaign_id: campaign.id,
      name: "Default",
      traffic_weight: 100,
      is_control: true,
      cta_url: ctaUrls.filter(Boolean)[0] || null,
      custom_fields: { ...overrides, CTA_URL: ctaUrls.filter(Boolean)[0] || "", CTA_URLS: JSON.stringify(ctaUrls.filter(Boolean)) },
    });

    router.push(`/campaigns/${campaign.id}`);
  };

  const input: React.CSSProperties = {
    width: "100%", padding: "8px 12px", background: "#13131b", border: "1px solid #1e1e2e",
    borderRadius: 6, color: "#e4e4f0", fontSize: 13, boxSizing: "border-box", outline: "none",
  };
  const label: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 500, color: "#6b6b80", marginBottom: 4 };
  const section: React.CSSProperties = { background: "#111118", borderRadius: 8, border: "1px solid #1e1e2e", padding: 16, marginBottom: 12 };
  const sectionTitle: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: "#e4e4f0", margin: "0 0 12px", display: "flex", alignItems: "center", gap: 8 };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: "#e4e4f0", margin: 0 }}>New Campaign</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => handleCreate(false)} disabled={saving || !name || !slug || !landerId} style={{
            padding: "7px 16px", background: "#1e1e2e", color: "#e4e4f0",
            border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer",
            opacity: !name || !slug || !landerId ? 0.4 : 1,
          }}>
            Save Draft
          </button>
          <button onClick={() => handleCreate(true)} disabled={saving || !name || !slug || !landerId} style={{
            padding: "7px 18px", background: !name || !slug || !landerId ? "#2a2a3a" : "#6366f1",
            color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 500,
            cursor: !name || !slug || !landerId ? "not-allowed" : "pointer",
            opacity: saving ? 0.7 : 1,
          }}>
            {saving ? "Creating..." : "Create & Activate"}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16 }}>
        {/* Left column */}
        <div>
          {/* Campaign Details */}
          <div style={section}>
            <h2 style={sectionTitle}>
              <span style={{ width: 20, height: 20, borderRadius: 4, background: "#6366f120", color: "#6366f1", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>1</span>
              Campaign Details
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <label style={label}>Campaign Name *</label>
                <input value={name} onChange={(e) => setName(e.target.value)} style={input} placeholder="e.g. Bahigo Casino TR" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#555", padding: "0 4px" }}>/lp/</span>
                <input value={slug} onChange={(e) => setSlug(e.target.value)} style={input} placeholder="bahigo-casino-tr" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                <div><label style={label}>Operator</label><input value={operator} onChange={(e) => setOperator(e.target.value)} style={input} placeholder="Bahigo" /></div>
                <div><label style={label}>GEO</label><input value={geo} onChange={(e) => setGeo(e.target.value)} style={input} placeholder="TR" /></div>
                <div><label style={label}>Source</label><input value={source} onChange={(e) => setSource(e.target.value)} style={input} placeholder="propellerads" /></div>
              </div>
            </div>
          </div>

          {/* Select Lander */}
          <div style={section}>
            <h2 style={sectionTitle}>
              <span style={{ width: 20, height: 20, borderRadius: 4, background: "#6366f120", color: "#6366f1", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>2</span>
              Select Lander
            </h2>
            {landers.length === 0 ? (
              <div style={{ textAlign: "center", padding: 24, color: "#555", border: "1px dashed #1e1e2e", borderRadius: 8 }}>
                No landers uploaded. <a href="/landers/upload" style={{ color: "#6366f1", textDecoration: "none" }}>Upload one first</a>.
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8 }}>
                {landers.map((l) => {
                  const isSelected = landerId === l.id;
                  return (
                    <div key={l.id} onClick={() => setLanderId(l.id)} style={{
                      padding: "10px 12px", borderRadius: 6, cursor: "pointer",
                      border: `2px solid ${isSelected ? "#6366f1" : "#1e1e2e"}`,
                      background: isSelected ? "#6366f108" : "#16161e",
                      transition: "all 0.1s",
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: isSelected ? "#e4e4f0" : "#8b8ba0", marginBottom: 2 }}>{l.name}</div>
                      <div style={{ fontSize: 10, color: "#555" }}>{l.notes || "—"}</div>
                    </div>
                  );
                })}
              </div>
            )}
            {selectedLander && (
              <button
                onClick={() => setPreviewLander(previewLander ? null : selectedLander)}
                style={{ marginTop: 8, padding: "5px 12px", background: "#1e1e2e", color: "#8b8ba0", border: "none", borderRadius: 4, fontSize: 11, cursor: "pointer" }}
              >
                {previewLander ? "Hide Preview" : "Preview Lander"}
              </button>
            )}
          </div>

          {/* CTA Configuration */}
          <div style={{ ...section, borderColor: "#6366f130" }}>
            <h2 style={sectionTitle}>
              <span style={{ width: 20, height: 20, borderRadius: 4, background: "#6366f120", color: "#6366f1", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>3</span>
              CTA / Offer URLs
            </h2>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <label style={label}>Destination URLs (where the CTA sends traffic)</label>
              {ctaUrls.length < 3 && (
                <button onClick={() => setCtaUrls([...ctaUrls, ""])} style={{
                  padding: "2px 8px", background: "#6366f120", color: "#6366f1",
                  border: "none", borderRadius: 4, fontSize: 10, cursor: "pointer", fontWeight: 500,
                }}>
                  + Add URL
                </button>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {ctaUrls.map((url, i) => (
                <div key={i} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  {ctaUrls.length > 1 && <span style={{ fontSize: 10, color: "#6366f1", fontFamily: "monospace", minWidth: 14 }}>{i + 1}.</span>}
                  <input
                    value={url}
                    onChange={(e) => { const next = [...ctaUrls]; next[i] = e.target.value; setCtaUrls(next); }}
                    style={{ ...input, flex: 1, borderColor: url ? "#6366f140" : "#1e1e2e" }}
                    placeholder="https://operator.com/register?btag=AFFTAG"
                  />
                  {ctaUrls.length > 1 && (
                    <button onClick={() => setCtaUrls(ctaUrls.filter((_, j) => j !== i))} style={{
                      background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 14, padding: 2,
                    }}>✕</button>
                  )}
                </div>
              ))}
            </div>
            {ctaUrls.filter(Boolean).length > 1 && (
              <p style={{ fontSize: 10, color: "#6366f1", margin: "6px 0 0", opacity: 0.7 }}>
                Traffic will be split equally across {ctaUrls.filter(Boolean).length} URLs on each CTA click.
              </p>
            )}
            <p style={{ fontSize: 10, color: "#555", margin: "4px 0 0" }}>
              Click tracking is auto-injected. Your lander&apos;s {"{{CTA_URL}}"} will be replaced with a tracked redirect.
            </p>
          </div>

          {/* Variable Overrides */}
          {variables.length > 0 && (
            <div style={section}>
              <h2 style={sectionTitle}>
                <span style={{ width: 20, height: 20, borderRadius: 4, background: "#6366f120", color: "#6366f1", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>4</span>
                Lander Variables
              </h2>
              <p style={{ fontSize: 11, color: "#555", margin: "0 0 10px" }}>
                Customize the lander content. You can create variants with different values later from the campaign page.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {variables.map((v: string) => (
                  <div key={v}>
                    <label style={{ fontSize: 10, color: "#6366f1", fontFamily: "monospace", display: "block", marginBottom: 3 }}>{`{{${v}}}`}</label>
                    <input
                      value={overrides[v] || ""}
                      onChange={(e) => setOverrides({ ...overrides, [v]: e.target.value })}
                      style={{ ...input, fontSize: 12 }}
                      placeholder={selectedLander?.defaults?.[v] || ""}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column — Preview */}
        <div>
          <div style={{ position: "sticky", top: 20 }}>
            {previewLander ? (
              <div style={{ background: "#111118", borderRadius: 8, border: "1px solid #1e1e2e", overflow: "hidden" }}>
                <div style={{ padding: "8px 12px", borderBottom: "1px solid #1e1e2e", fontSize: 11, color: "#6b6b80" }}>
                  Lander Preview — {previewLander.name}
                </div>
                <iframe
                  srcDoc={previewLander.html}
                  style={{ width: "100%", height: 550, border: "none", display: "block" }}
                  sandbox="allow-same-origin allow-scripts"
                  title="Preview"
                />
              </div>
            ) : (
              <div style={{ background: "#111118", borderRadius: 8, border: "1px solid #1e1e2e", padding: 20 }}>
                <h3 style={{ fontSize: 13, fontWeight: 500, color: "#8b8ba0", margin: "0 0 12px" }}>Summary</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12 }}>
                  <Row label="Name" value={name || "—"} />
                  <Row label="Slug" value={slug ? `/lp/${slug}` : "—"} />
                  <Row label="Operator" value={operator || "—"} />
                  <Row label="GEO" value={geo || "—"} />
                  <Row label="Source" value={source || "—"} />
                  <Row label="Lander" value={selectedLander?.name || "Not selected"} highlight={!!selectedLander} />
                  <Row label="CTA URLs" value={ctaUrls.filter(Boolean).length > 0 ? `${ctaUrls.filter(Boolean).length} URL${ctaUrls.filter(Boolean).length > 1 ? "s" : ""}` : "Not set"} highlight={ctaUrls.filter(Boolean).length > 0} />
                  <Row label="Variables" value={`${variables.length} customizable`} />
                </div>

                {(!name || !slug || !landerId) && (
                  <div style={{ marginTop: 16, padding: 10, background: "#eab30810", border: "1px solid #eab30820", borderRadius: 6, fontSize: 11, color: "#eab308" }}>
                    {!name && <div>Campaign name required</div>}
                    {!landerId && <div>Select a lander</div>}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span style={{ color: "#6b6b80" }}>{label}</span>
      <span style={{ color: highlight ? "#6366f1" : "#8b8ba0", fontWeight: highlight ? 500 : 400, textAlign: "right", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</span>
    </div>
  );
}
