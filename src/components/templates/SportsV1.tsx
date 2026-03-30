"use client";

import { type LPTemplateProps } from "@/lib/types";

export default function SportsV1({ variant, campaign }: LPTemplateProps) {
  return (
    <>
      {variant.custom_css && <style dangerouslySetInnerHTML={{ __html: variant.custom_css }} />}
      <div style={{ background: "#0a1628", minHeight: "100vh", color: "#fff", fontFamily: "'Inter', sans-serif" }}>
        {/* Header */}
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", background: "#0d1f3c", borderBottom: "1px solid #1a3a5c" }}>
          <div style={{ width: 40 }} />
          <div style={{ fontWeight: 700, fontSize: 22, color: "#fff" }}>
            {campaign.operator || "Sports"}
          </div>
          <div style={{ fontSize: 12, color: "#6b8ab5" }}>Giriş</div>
        </header>

        {/* Hero */}
        <div style={{
          position: "relative",
          background: "linear-gradient(135deg, #0d2847 0%, #0a1628 60%, #132e4f 100%)",
          padding: "48px 20px 64px",
          textAlign: "center",
          overflow: "hidden",
        }}>
          {/* Sport decorations */}
          <div style={{ position: "absolute", top: "8%", left: "3%", fontSize: 36, opacity: 0.1, animation: "sportPulse 4s ease-in-out infinite" }}>⚽</div>
          <div style={{ position: "absolute", top: "15%", right: "6%", fontSize: 32, opacity: 0.08, animation: "sportPulse 5s ease-in-out infinite 1s" }}>🏀</div>
          <div style={{ position: "absolute", bottom: "20%", left: "8%", fontSize: 28, opacity: 0.1, animation: "sportPulse 6s ease-in-out infinite 0.5s" }}>🎾</div>

          {variant.hero_image_url && (
            <img src={variant.hero_image_url} alt="Hero" style={{ maxWidth: 260, margin: "0 auto 24px", display: "block" }} />
          )}

          <div style={{
            background: "rgba(13,31,60,0.8)",
            borderRadius: 16,
            padding: "36px 24px",
            maxWidth: 420,
            margin: "0 auto",
            border: "1px solid #1a3a5c",
          }}>
            <div style={{ fontSize: 14, color: "#4dabf7", fontWeight: 600, textTransform: "uppercase", letterSpacing: 2, marginBottom: 12 }}>
              Spor Bahisleri
            </div>
            <div style={{ fontSize: 44, fontWeight: 800, color: "#4dabf7", lineHeight: 1.1, marginBottom: 8 }}>
              {variant.headline || "₺5.000"}
            </div>
            <div style={{ fontSize: 17, fontWeight: 600, color: "#b0c4de", letterSpacing: 1 }}>
              {variant.subheadline || "Spor Hoş Geldin Bonusu"}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div style={{ padding: "0 20px", marginTop: -20, position: "relative", zIndex: 10 }}>
          <a href={variant.cta_url || "#"} style={{
            display: "block", maxWidth: 420, margin: "0 auto",
            background: variant.cta_color || "#4dabf7", color: "#fff",
            textAlign: "center", padding: "18px 24px", borderRadius: 12,
            textDecoration: "none", fontWeight: 700, fontSize: 19,
            boxShadow: `0 4px 24px ${variant.cta_color || "#4dabf7"}40`,
          }}>
            <div>{variant.cta_text || "Bahis Yap"}</div>
            {variant.cta_subtext && (
              <div style={{ fontSize: 13, fontWeight: 400, opacity: 0.85, marginTop: 4 }}>{variant.cta_subtext}</div>
            )}
          </a>
        </div>

        {/* Steps */}
        {variant.steps && variant.steps.length > 0 && (
          <div style={{ padding: "36px 20px", maxWidth: 420, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "center", gap: 8, alignItems: "center" }}>
              {variant.steps.map((step, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%",
                      background: variant.cta_color || "#4dabf7",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 700, fontSize: 16,
                    }}>
                      {i + 1}
                    </div>
                    <span style={{ fontSize: 12, color: "#8aa8c8", textAlign: "center", maxWidth: 80 }}>{step}</span>
                  </div>
                  {i < variant.steps.length - 1 && <div style={{ width: 32, height: 2, background: "#1a3a5c", marginBottom: 20 }} />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment Methods */}
        {variant.payment_methods && variant.payment_methods.length > 0 && (
          <div style={{ padding: "24px 20px", borderTop: "1px solid #1a3a5c" }}>
            <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 12 }}>
              {variant.payment_methods.map((method, i) => (
                <div key={i} style={{ background: "#0d2847", padding: "8px 16px", borderRadius: 8, fontSize: 12, color: "#8aa8c8", fontWeight: 500 }}>
                  {method}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer style={{ padding: "32px 20px", borderTop: "1px solid #1a3a5c", textAlign: "center", color: "#4a6a8a", fontSize: 11, lineHeight: 1.6 }}>
          <div style={{ marginBottom: 8 }}>
            <span style={{ display: "inline-block", border: "2px solid #ff4444", borderRadius: "50%", width: 28, height: 28, lineHeight: "24px", fontWeight: 700, color: "#ff4444", fontSize: 13 }}>18+</span>
          </div>
          <p>Kumar bağımlılık yapabilir. Lütfen sorumlu oynayın.</p>
          <p style={{ marginTop: 4 }}>{campaign.operator} &copy; {new Date().getFullYear()}</p>
        </footer>

        <div style={{ height: 80 }} />
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes sportPulse {
          0%, 100% { transform: scale(1) translateY(0); }
          50% { transform: scale(1.1) translateY(-10px); }
        }
      `}} />
    </>
  );
}
