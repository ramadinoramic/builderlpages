"use client";

const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
  active: { bg: "#0a2e1a", text: "#00ca6b", dot: "#00ca6b" },
  paused: { bg: "#2e2a0a", text: "#caa000", dot: "#caa000" },
  draft: { bg: "#1a1a2e", text: "#8888aa", dot: "#8888aa" },
  archived: { bg: "#2a1a1a", text: "#aa5555", dot: "#aa5555" },
};

export default function StatusBadge({ status }: { status: string }) {
  const colors = statusColors[status] || statusColors.draft;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 500,
      background: colors.bg, color: colors.text,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: colors.dot }} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
