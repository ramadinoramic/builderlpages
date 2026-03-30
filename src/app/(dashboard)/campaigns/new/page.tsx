"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { type Lander } from "@/lib/types";

export default function NewCampaignPage() {
  const router = useRouter();
  const [landers, setLanders] = useState<Lander[]>([]);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 1
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [operator, setOperator] = useState("");
  const [geo, setGeo] = useState("");
  const [source, setSource] = useState("");

  // Step 2
  const [landerId, setLanderId] = useState<string | null>(null);

  // Step 3 - variants
  const [varA, setVarA] = useState<Record<string, string>>({});
  const [varB, setVarB] = useState<Record<string, string>>({});

  const selectedLander = landers.find((l) => l.id === landerId);
  const variables = selectedLander?.variables || [];

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

  // Pre-fill defaults when lander is selected
  useEffect(() => {
    if (selectedLander?.defaults) {
      setVarA({ ...selectedLander.defaults });
      setVarB({ ...selectedLander.defaults });
    }
  }, [landerId, selectedLander?.defaults]);

  const handleCreate = async (activate: boolean) => {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: campaign, error } = await supabase
      .from("campaigns")
      .insert({
        name, slug, operator: operator || null, geo: geo || null,
        traffic_source: source || null,
        template: null,
        lander_id: landerId || null,
        status: activate ? "active" : "draft",
        created_by: user?.id || null,
      })
      .select("id")
      .single();

    if (error || !campaign) {
      alert("Error: " + (error?.message || "Unknown"));
      setSaving(false);
      return;
    }

    // Create variants with variable values in custom_fields
    const variants = [
      { name: "Control", traffic_weight: 50, is_control: true, custom_fields: varA,
        cta_url: varA.CTA_URL || null, headline: varA.HEADLINE || null, subheadline: varA.SUBHEADLINE || null,
        cta_text: varA.CTA_TEXT || null, cta_color: varA.CTA_COLOR || null },
      { name: "Variant B", traffic_weight: 50, is_control: false, custom_fields: varB,
        cta_url: varB.CTA_URL || null, headline: varB.HEADLINE || null, subheadline: varB.SUBHEADLINE || null,
        cta_text: varB.CTA_TEXT || null, cta_color: varB.CTA_COLOR || null },
    ];

    for (const v of variants) {
      await supabase.from("variants").insert({ ...v, campaign_id: campaign.id });
    }

    router.push(`/campaigns/${campaign.id}`);
  };

  const input: React.CSSProperties = {
    width: "100%", padding: "8px 12px", background: "#16161e", border: "1px solid #1e1e2e",
    borderRadius: 6, color: "#e4e4f0", fontSize: 13, boxSizing: "border-box",
  };
  const label: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 500, color: "#6b6b80", marginBottom: 4 };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ fontSize: 20, fontWeight: 600, color: "#e4e4f0", marginBottom: 20 }}>New Campaign</h1>

      {/* Steps */}
      <div style={{ display: "flex", gap: 2, marginBottom: 24 }}>
        {["Details", "Lander", "Variants"].map((s, i) => (
          <div key={s} style={{
            flex: 1, padding: "7px 0", textAlign: "center", borderRadius: 4,
            background: step === i + 1 ? "#6366f1" : step > i + 1 ? "#1a1a2e" : "#111118",
            color: step === i + 1 ? "#fff" : step > i + 1 ? "#6366f1" : "#555",
            fontSize: 12, fontWeight: 500,
          }}>
            {i + 1}. {s}
          </div>
        ))}
      </div>

      {/* Step 1: Details */}
      {step === 1 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={label}>Campaign Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} style={input} placeholder="e.g. Bahigo Casino TR" />
          </div>
          <div>
            <label style={label}>Slug</label>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 12, color: "#555" }}>/lp/</span>
              <input value={slug} onChange={(e) => setSlug(e.target.value)} style={{ ...input, flex: 1 }} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <div><label style={label}>Operator</label><input value={operator} onChange={(e) => setOperator(e.target.value)} style={input} placeholder="Bahigo" /></div>
            <div><label style={label}>GEO</label><input value={geo} onChange={(e) => setGeo(e.target.value)} style={input} placeholder="TR" /></div>
            <div><label style={label}>Traffic Source</label><input value={source} onChange={(e) => setSource(e.target.value)} style={input} placeholder="propellerads" /></div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
            <button onClick={() => setStep(2)} disabled={!name || !slug} style={{
              padding: "8px 20px", background: name && slug ? "#6366f1" : "#333",
              color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 500,
              cursor: name && slug ? "pointer" : "not-allowed",
            }}>
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Pick Lander */}
      {step === 2 && (
        <div>
          <p style={{ fontSize: 12, color: "#6b6b80", marginBottom: 14 }}>
            Select a lander from your repository. Each variant will use this lander with different variable values.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10, marginBottom: 20 }}>
            {landers.map((l) => {
              const isSelected = landerId === l.id;
              const vars = Array.isArray(l.variables) ? l.variables : [];
              return (
                <div
                  key={l.id}
                  onClick={() => setLanderId(l.id)}
                  style={{
                    background: "#111118", borderRadius: 8, padding: 14, cursor: "pointer",
                    border: `2px solid ${isSelected ? "#6366f1" : "#1e1e2e"}`,
                    transition: "border-color 0.1s",
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#e4e4f0", marginBottom: 4 }}>{l.name}</div>
                  <div style={{ fontSize: 11, color: "#6b6b80", marginBottom: 6 }}>{l.notes || "No description"}</div>
                  <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                    {vars.slice(0, 4).map((v: string) => (
                      <span key={v} style={{ padding: "1px 5px", background: "#1e1e2e", borderRadius: 3, fontSize: 10, color: "#8b8ba0", fontFamily: "monospace" }}>
                        {v}
                      </span>
                    ))}
                    {vars.length > 4 && <span style={{ fontSize: 10, color: "#555" }}>+{vars.length - 4}</span>}
                  </div>
                </div>
              );
            })}
          </div>
          {landers.length === 0 && (
            <div style={{ textAlign: "center", padding: 32, background: "#111118", borderRadius: 8, border: "1px solid #1e1e2e", color: "#6b6b80", fontSize: 13 }}>
              No landers uploaded yet. <a href="/landers/upload" style={{ color: "#6366f1" }}>Upload one first</a>.
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            <button onClick={() => setStep(1)} style={{ padding: "8px 16px", background: "transparent", color: "#6b6b80", border: "1px solid #1e1e2e", borderRadius: 6, fontSize: 13, cursor: "pointer" }}>
              Back
            </button>
            <button onClick={() => setStep(3)} disabled={!landerId} style={{
              padding: "8px 20px", background: landerId ? "#6366f1" : "#333",
              color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 500,
              cursor: landerId ? "pointer" : "not-allowed",
            }}>
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Variants */}
      {step === 3 && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
            {[
              { label: "Control (A)", data: varA, setData: setVarA },
              { label: "Variant B", data: varB, setData: setVarB },
            ].map(({ label: vLabel, data, setData }) => (
              <div key={vLabel} style={{ background: "#111118", borderRadius: 8, border: "1px solid #1e1e2e", padding: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#e4e4f0", marginBottom: 12 }}>{vLabel}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {variables.map((v: string) => (
                    <div key={v}>
                      <label style={{ fontSize: 10, color: "#6b6b80", fontFamily: "monospace", display: "block", marginBottom: 2 }}>
                        {`{{${v}}}`}
                      </label>
                      <input
                        value={data[v] || ""}
                        onChange={(e) => setData({ ...data, [v]: e.target.value })}
                        style={{ ...input, fontSize: 12 }}
                        placeholder={selectedLander?.defaults?.[v] || ""}
                      />
                    </div>
                  ))}
                  {variables.length === 0 && (
                    <p style={{ fontSize: 12, color: "#555", margin: 0 }}>This lander has no variables. The same content will show for both variants.</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <button onClick={() => setStep(2)} style={{ padding: "8px 16px", background: "transparent", color: "#6b6b80", border: "1px solid #1e1e2e", borderRadius: 6, fontSize: 13, cursor: "pointer" }}>
              Back
            </button>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => handleCreate(false)} disabled={saving} style={{
                padding: "8px 16px", background: "#1e1e2e", color: "#e4e4f0",
                border: "none", borderRadius: 6, fontSize: 13, cursor: "pointer",
              }}>
                Save Draft
              </button>
              <button onClick={() => handleCreate(true)} disabled={saving} style={{
                padding: "8px 20px", background: "#6366f1", color: "#fff",
                border: "none", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer",
                opacity: saving ? 0.7 : 1,
              }}>
                {saving ? "Creating..." : "Create & Activate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
