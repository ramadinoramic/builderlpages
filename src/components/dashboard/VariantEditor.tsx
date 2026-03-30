"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { type Variant, type EditableField } from "@/lib/types";
import { X } from "lucide-react";

interface VariantEditorProps {
  variant: Variant;
  editableFields: EditableField[];
  campaignSlug: string;
  onClose: () => void;
  onSave: (updated: Variant) => void;
}

export default function VariantEditor({ variant, editableFields, campaignSlug, onClose, onSave }: VariantEditorProps) {
  const [form, setForm] = useState<Record<string, unknown>>(() => {
    const initial: Record<string, unknown> = {};
    for (const field of editableFields) {
      initial[field.key] = (variant as unknown as Record<string, unknown>)[field.key] ?? "";
    }
    return initial;
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (key: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("variants")
      .update(form)
      .eq("id", variant.id)
      .select()
      .single();

    if (!error && data) {
      onSave(data as Variant);
    }
    setSaving(false);
  };

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const previewUrl = `${baseUrl}/lp/${campaignSlug}?preview=${variant.id}`;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", justifyContent: "flex-end" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)" }} onClick={onClose} />
      <div style={{
        position: "relative", width: 480, maxWidth: "100vw", background: "#1a1a2e",
        borderLeft: "1px solid #2a2a40", padding: 24, overflowY: "auto", height: "100vh",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#fff", margin: 0 }}>
            Edit: {variant.name}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#8888aa", cursor: "pointer" }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {editableFields.map((field) => (
            <div key={field.key}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#8888aa", marginBottom: 6 }}>
                {field.label}
              </label>
              {field.type === "color" ? (
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="color"
                    value={(form[field.key] as string) || "#00ca6b"}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    style={{ width: 40, height: 36, border: "none", borderRadius: 6, cursor: "pointer", background: "transparent" }}
                  />
                  <input
                    type="text"
                    value={(form[field.key] as string) || ""}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    style={{
                      flex: 1, padding: "8px 12px", background: "#242438", border: "1px solid #2a2a40",
                      borderRadius: 8, color: "#fff", fontSize: 13, fontFamily: "monospace",
                    }}
                  />
                </div>
              ) : field.type === "textarea" || field.type === "code" ? (
                <textarea
                  value={(form[field.key] as string) || ""}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  rows={field.type === "code" ? 6 : 3}
                  style={{
                    width: "100%", padding: "8px 12px", background: "#242438", border: "1px solid #2a2a40",
                    borderRadius: 8, color: "#fff", fontSize: 13, resize: "vertical", boxSizing: "border-box",
                    fontFamily: field.type === "code" ? "monospace" : "inherit",
                  }}
                />
              ) : field.type === "list" ? (
                <textarea
                  value={(() => {
                    const v = form[field.key];
                    if (Array.isArray(v)) return v.join("\n");
                    if (typeof v === "string") {
                      try { const parsed = JSON.parse(v); return Array.isArray(parsed) ? parsed.join("\n") : v; } catch { return v; }
                    }
                    return "";
                  })()}
                  onChange={(e) => {
                    const items = e.target.value.split("\n").filter(Boolean);
                    handleChange(field.key, JSON.stringify(items));
                  }}
                  rows={3}
                  placeholder="One item per line"
                  style={{
                    width: "100%", padding: "8px 12px", background: "#242438", border: "1px solid #2a2a40",
                    borderRadius: 8, color: "#fff", fontSize: 13, resize: "vertical", boxSizing: "border-box",
                  }}
                />
              ) : (
                <input
                  type={field.type === "url" ? "url" : "text"}
                  value={(form[field.key] as string) || ""}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  style={{
                    width: "100%", padding: "8px 12px", background: "#242438", border: "1px solid #2a2a40",
                    borderRadius: 8, color: "#fff", fontSize: 13, boxSizing: "border-box",
                  }}
                />
              )}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: 1, padding: "12px", background: "#00ca6b", color: "#fff",
              border: "none", borderRadius: 8, fontWeight: 600, fontSize: 14,
              cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: "12px 20px", background: "#242438", color: "#8888aa",
              border: "1px solid #2a2a40", borderRadius: 8, fontWeight: 500, fontSize: 14,
              textDecoration: "none", textAlign: "center",
            }}
          >
            Preview
          </a>
        </div>
      </div>
    </div>
  );
}
