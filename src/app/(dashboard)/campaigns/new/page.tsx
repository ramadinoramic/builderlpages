"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { type Template, type EditableField } from "@/lib/types";

export default function NewCampaignPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [operator, setOperator] = useState("");
  const [geo, setGeo] = useState("");
  const [trafficSource, setTrafficSource] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [editableFields, setEditableFields] = useState<EditableField[]>([]);
  const [variantA, setVariantA] = useState<Record<string, string>>({});
  const [variantB, setVariantB] = useState<Record<string, string>>({});

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.from("templates").select("*").eq("is_active", true);
      if (data) setTemplates(data as Template[]);
    }
    load();
  }, []);

  // Auto-generate slug from name
  useEffect(() => {
    setSlug(name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
  }, [name]);

  // Update editable fields when template changes
  useEffect(() => {
    const tmpl = templates.find((t) => t.id === templateId);
    if (tmpl) {
      const fields = typeof tmpl.editable_fields === "string"
        ? JSON.parse(tmpl.editable_fields)
        : tmpl.editable_fields;
      setEditableFields(fields);
    }
  }, [templateId, templates]);

  const handleCreate = async () => {
    setSaving(true);
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();

    const { data: campaign, error } = await supabase
      .from("campaigns")
      .insert({
        name,
        slug,
        operator: operator || null,
        geo: geo || null,
        traffic_source: trafficSource || null,
        template: templateId,
        status: "draft",
        created_by: user?.id || null,
      })
      .select()
      .single();

    if (error || !campaign) {
      alert("Failed to create campaign: " + (error?.message || "Unknown error"));
      setSaving(false);
      return;
    }

    // Create variants
    const variantsToInsert = [
      { ...variantA, campaign_id: campaign.id, name: "Control", traffic_weight: 50, is_control: true },
      { ...variantB, campaign_id: campaign.id, name: "Variant B", traffic_weight: 50, is_control: false },
    ];

    for (const v of variantsToInsert) {
      await supabase.from("variants").insert(v);
    }

    router.push(`/campaigns/${campaign.id}`);
  };

  const inputStyle = {
    width: "100%", padding: "10px 14px", background: "#242438", border: "1px solid #2a2a40",
    borderRadius: 8, color: "#fff", fontSize: 14, boxSizing: "border-box" as const,
  };

  const labelStyle = {
    display: "block" as const, fontSize: 13, fontWeight: 500, color: "#8888aa", marginBottom: 6,
  };

  return (
    <div style={{ maxWidth: 700, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "#fff", marginBottom: 8 }}>Create Campaign</h1>

      {/* Step indicator */}
      <div style={{ display: "flex", gap: 4, marginBottom: 32 }}>
        {["Basics", "Template", "Variants", "Review"].map((s, i) => (
          <div key={s} style={{
            flex: 1, padding: "8px 0", textAlign: "center", borderRadius: 6,
            background: step === i + 1 ? "#00ca6b" : step > i + 1 ? "#0a2e1a" : "#242438",
            color: step === i + 1 ? "#fff" : step > i + 1 ? "#00ca6b" : "#666688",
            fontSize: 13, fontWeight: 600,
          }}>
            {s}
          </div>
        ))}
      </div>

      {/* Step 1: Basics */}
      {step === 1 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={labelStyle}>Campaign Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} placeholder="e.g. Bahigo Casino - Turkey" />
          </div>
          <div>
            <label style={labelStyle}>Slug (URL path)</label>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "#666688", fontSize: 13 }}>/lp/</span>
              <input value={slug} onChange={(e) => setSlug(e.target.value)} style={{ ...inputStyle, flex: 1 }} placeholder="bahigo-casino-tr" />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Operator</label>
              <input value={operator} onChange={(e) => setOperator(e.target.value)} style={inputStyle} placeholder="e.g. Bahigo" />
            </div>
            <div>
              <label style={labelStyle}>Geo</label>
              <input value={geo} onChange={(e) => setGeo(e.target.value)} style={inputStyle} placeholder="e.g. TR" />
            </div>
            <div>
              <label style={labelStyle}>Traffic Source</label>
              <input value={trafficSource} onChange={(e) => setTrafficSource(e.target.value)} style={inputStyle} placeholder="e.g. propellerads" />
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button onClick={() => setStep(2)} disabled={!name || !slug} style={{
              padding: "10px 24px", background: name && slug ? "#00ca6b" : "#666688", color: "#fff",
              border: "none", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: name && slug ? "pointer" : "not-allowed",
            }}>
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Template */}
      {step === 2 && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
            {templates.map((t) => (
              <div
                key={t.id}
                onClick={() => setTemplateId(t.id)}
                style={{
                  background: "#1a1a2e", borderRadius: 12, padding: 16, cursor: "pointer",
                  border: `2px solid ${templateId === t.id ? "#00ca6b" : "#2a2a40"}`,
                  transition: "border-color 0.15s",
                }}
              >
                <div style={{
                  height: 100, background: "#242438", borderRadius: 8, marginBottom: 12,
                  display: "flex", alignItems: "center", justifyContent: "center", color: "#666688", fontSize: 32,
                }}>
                  {t.category === "casino" ? "🎰" : "⚽"}
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "#fff", margin: "0 0 4px" }}>{t.name}</h3>
                <p style={{ fontSize: 12, color: "#666688", margin: 0 }}>{t.description}</p>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <button onClick={() => setStep(1)} style={{ padding: "10px 24px", background: "#242438", color: "#8888aa", border: "1px solid #2a2a40", borderRadius: 8, fontWeight: 500, fontSize: 14, cursor: "pointer" }}>
              Back
            </button>
            <button onClick={() => setStep(3)} disabled={!templateId} style={{
              padding: "10px 24px", background: templateId ? "#00ca6b" : "#666688", color: "#fff",
              border: "none", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: templateId ? "pointer" : "not-allowed",
            }}>
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Variants */}
      {step === 3 && (
        <div>
          {["Control", "Variant B"].map((variantName, idx) => {
            const data = idx === 0 ? variantA : variantB;
            const setData = idx === 0 ? setVariantA : setVariantB;
            return (
              <div key={variantName} style={{ background: "#1a1a2e", borderRadius: 12, padding: 20, border: "1px solid #2a2a40", marginBottom: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: "0 0 16px" }}>{variantName}</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {editableFields.map((field) => (
                    <div key={field.key}>
                      <label style={labelStyle}>{field.label}</label>
                      {field.type === "color" ? (
                        <div style={{ display: "flex", gap: 8 }}>
                          <input type="color" value={data[field.key] || "#00ca6b"} onChange={(e) => setData({ ...data, [field.key]: e.target.value })} style={{ width: 40, height: 36, border: "none", borderRadius: 6 }} />
                          <input type="text" value={data[field.key] || ""} onChange={(e) => setData({ ...data, [field.key]: e.target.value })} style={{ ...inputStyle, flex: 1 }} />
                        </div>
                      ) : field.type === "textarea" || field.type === "code" ? (
                        <textarea value={data[field.key] || ""} onChange={(e) => setData({ ...data, [field.key]: e.target.value })} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
                      ) : (
                        <input type={field.type === "url" ? "url" : "text"} value={data[field.key] || ""} onChange={(e) => setData({ ...data, [field.key]: e.target.value })} style={inputStyle} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <button onClick={() => setStep(2)} style={{ padding: "10px 24px", background: "#242438", color: "#8888aa", border: "1px solid #2a2a40", borderRadius: 8, fontWeight: 500, fontSize: 14, cursor: "pointer" }}>
              Back
            </button>
            <button onClick={() => setStep(4)} style={{ padding: "10px 24px", background: "#00ca6b", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
              Review
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Review */}
      {step === 4 && (
        <div>
          <div style={{ background: "#1a1a2e", borderRadius: 12, padding: 20, border: "1px solid #2a2a40", marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: "0 0 12px" }}>Summary</h3>
            <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 8, fontSize: 14 }}>
              <span style={{ color: "#666688" }}>Name:</span><span style={{ color: "#fff" }}>{name}</span>
              <span style={{ color: "#666688" }}>Slug:</span><span style={{ color: "#fff" }}>/lp/{slug}</span>
              <span style={{ color: "#666688" }}>Operator:</span><span style={{ color: "#fff" }}>{operator || "—"}</span>
              <span style={{ color: "#666688" }}>Geo:</span><span style={{ color: "#fff" }}>{geo || "—"}</span>
              <span style={{ color: "#666688" }}>Source:</span><span style={{ color: "#fff" }}>{trafficSource || "—"}</span>
              <span style={{ color: "#666688" }}>Template:</span><span style={{ color: "#fff" }}>{templateId}</span>
              <span style={{ color: "#666688" }}>Variants:</span><span style={{ color: "#fff" }}>2 (50/50 split)</span>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <button onClick={() => setStep(3)} style={{ padding: "10px 24px", background: "#242438", color: "#8888aa", border: "1px solid #2a2a40", borderRadius: 8, fontWeight: 500, fontSize: 14, cursor: "pointer" }}>
              Back
            </button>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleCreate} disabled={saving} style={{
                padding: "10px 24px", background: "#242438", color: "#fff",
                border: "1px solid #2a2a40", borderRadius: 8, fontWeight: 500, fontSize: 14, cursor: "pointer",
              }}>
                {saving ? "Creating..." : "Save as Draft"}
              </button>
              <button onClick={async () => { await handleCreate(); }} disabled={saving} style={{
                padding: "10px 24px", background: "#00ca6b", color: "#fff",
                border: "none", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: "pointer",
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
