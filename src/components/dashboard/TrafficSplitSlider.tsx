"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface TrafficSplitSliderProps {
  variants: Array<{ id: string; name: string; traffic_weight: number; is_control: boolean }>;
  onUpdate: (variants: Array<{ id: string; traffic_weight: number }>) => void;
}

export default function TrafficSplitSlider({ variants: initialVariants, onUpdate }: TrafficSplitSliderProps) {
  const [variants, setVariants] = useState(initialVariants);
  const [saving, setSaving] = useState(false);

  const handleWeightChange = (targetId: string, newWeight: number) => {
    const total = 100;
    const others = variants.filter((v) => v.id !== targetId);
    const othersTotal = others.reduce((s, v) => s + v.traffic_weight, 0);

    const updated = variants.map((v) => {
      if (v.id === targetId) {
        return { ...v, traffic_weight: newWeight };
      }
      // Redistribute remaining weight proportionally
      if (othersTotal > 0) {
        const proportion = v.traffic_weight / othersTotal;
        return { ...v, traffic_weight: Math.round((total - newWeight) * proportion) };
      }
      return { ...v, traffic_weight: Math.round((total - newWeight) / others.length) };
    });

    setVariants(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();

    for (const v of variants) {
      await supabase
        .from("variants")
        .update({ traffic_weight: v.traffic_weight })
        .eq("id", v.id);
    }

    onUpdate(variants.map((v) => ({ id: v.id, traffic_weight: v.traffic_weight })));
    setSaving(false);
  };

  const total = variants.reduce((s, v) => s + v.traffic_weight, 0);

  return (
    <div style={{ background: "#242438", borderRadius: 12, padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: "#fff", margin: 0 }}>Traffic Split</h3>
        <span className="stat-number" style={{ fontSize: 12, color: total === 100 ? "#00ca6b" : "#ff6b6b" }}>
          Total: {total}%
        </span>
      </div>

      {/* Visual bar */}
      <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden", marginBottom: 16, gap: 2 }}>
        {variants.map((v, i) => {
          const colors = ["#00ca6b", "#4dabf7", "#c471f5", "#ff6b35", "#ffd700"];
          return (
            <div
              key={v.id}
              style={{
                width: `${v.traffic_weight}%`,
                background: colors[i % colors.length],
                transition: "width 0.2s",
              }}
            />
          );
        })}
      </div>

      {variants.map((v, i) => {
        const colors = ["#00ca6b", "#4dabf7", "#c471f5", "#ff6b35", "#ffd700"];
        return (
          <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: colors[i % colors.length], flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: "#fff", minWidth: 100 }}>
              {v.name} {v.is_control && <span style={{ color: "#8888aa", fontSize: 11 }}>(control)</span>}
            </span>
            <input
              type="range"
              min={0}
              max={100}
              value={v.traffic_weight}
              onChange={(e) => handleWeightChange(v.id, parseInt(e.target.value))}
              style={{ flex: 1, accentColor: colors[i % colors.length] }}
            />
            <span className="stat-number" style={{ fontSize: 13, color: "#fff", minWidth: 36, textAlign: "right" }}>
              {v.traffic_weight}%
            </span>
          </div>
        );
      })}

      <button
        onClick={handleSave}
        disabled={saving || total !== 100}
        style={{
          marginTop: 8, padding: "8px 16px", background: total === 100 ? "#00ca6b" : "#666688",
          color: "#fff", border: "none", borderRadius: 6, fontWeight: 600, fontSize: 13,
          cursor: saving || total !== 100 ? "not-allowed" : "pointer", width: "100%",
          opacity: saving ? 0.7 : 1,
        }}
      >
        {saving ? "Saving..." : total !== 100 ? `Total must be 100% (currently ${total}%)` : "Save Split"}
      </button>
    </div>
  );
}
