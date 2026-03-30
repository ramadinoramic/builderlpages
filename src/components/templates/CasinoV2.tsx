"use client";

import { type LPTemplateProps } from "@/lib/types";

export default function CasinoV2({ variant, campaign }: LPTemplateProps) {
  return (
    <>
      {variant.custom_css && <style dangerouslySetInnerHTML={{ __html: variant.custom_css }} />}
      <div style={{ background: "linear-gradient(180deg, #1a0a2e 0%, #0f0520 100%)", minHeight: "100vh", color: "#fff", fontFamily: "'Inter', sans-serif" }}>
        {/* Header */}
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", background: "rgba(26,10,46,0.9)", borderBottom: "1px solid #2a1545" }}>
          <div style={{ width: 40 }} />
          <div style={{ fontWeight: 700, fontSize: 22, background: "linear-gradient(135deg, #c471f5, #fa71cd)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            {campaign.operator || "Casino"}
          </div>
          <div style={{ fontSize: 12, color: "#8a6aaa" }}>Giriş</div>
        </header>

        {/* Hero — horizontal layout on desktop */}
        <div style={{ padding: "40px 20px 32px", maxWidth: 800, margin: "0 auto" }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 32, justifyContent: "center" }}>
            {/* Left: content */}
            <div style={{ flex: "1 1 300px", textAlign: "center" }}>
              <div style={{ fontSize: 14, color: "#c471f5", fontWeight: 600, textTransform: "uppercase", letterSpacing: 2, marginBottom: 12 }}>
                Özel Teklif
              </div>
              <div style={{ fontSize: 52, fontWeight: 800, background: "linear-gradient(135deg, #FFD700, #c471f5)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1.1, marginBottom: 8 }}>
                {variant.headline || "₺15.000"}
              </div>
              <div style={{ fontSize: 18, fontWeight: 600, color: "#d4b8e8", marginBottom: 24 }}>
                {variant.subheadline || "Hoş Geldin Bonusu"}
              </div>

              <a href={variant.cta_url || "#"} style={{
                display: "inline-block",
                background: `linear-gradient(135deg, ${variant.cta_color || "#c471f5"}, #fa71cd)`,
                color: "#fff", padding: "16px 48px", borderRadius: 50,
                textDecoration: "none", fontWeight: 700, fontSize: 18,
                boxShadow: "0 4px 30px rgba(196,113,245,0.4)",
                transition: "transform 0.2s",
              }}>
                {variant.cta_text || "Şimdi Katıl"}
              </a>
              {variant.cta_subtext && (
                <div style={{ fontSize: 13, color: "#8a6aaa", marginTop: 8 }}>{variant.cta_subtext}</div>
              )}
            </div>

            {/* Right: image */}
            {variant.hero_image_url && (
              <div style={{ flex: "1 1 250px", textAlign: "center" }}>
                <img src={variant.hero_image_url} alt="Hero" style={{ maxWidth: 280, borderRadius: 16 }} />
              </div>
            )}
          </div>
        </div>

        {/* Steps */}
        {variant.steps && variant.steps.length > 0 && (
          <div style={{ padding: "32px 20px", maxWidth: 500, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "center", gap: 24 }}>
              {variant.steps.map((step, i) => (
                <div key={i} style={{ textAlign: "center" }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: "50%",
                    background: "linear-gradient(135deg, #c471f5, #fa71cd)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, fontSize: 18, margin: "0 auto 8px",
                  }}>
                    {i + 1}
                  </div>
                  <span style={{ fontSize: 12, color: "#b090cc" }}>{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment Methods */}
        {variant.payment_methods && variant.payment_methods.length > 0 && (
          <div style={{ padding: "24px 20px", borderTop: "1px solid #2a1545" }}>
            <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 12 }}>
              {variant.payment_methods.map((method, i) => (
                <div key={i} style={{ background: "#2a1545", padding: "8px 16px", borderRadius: 20, fontSize: 12, color: "#b090cc", fontWeight: 500 }}>
                  {method}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer style={{ padding: "32px 20px", borderTop: "1px solid #2a1545", textAlign: "center", color: "#5a3a7a", fontSize: 11, lineHeight: 1.6 }}>
          <div style={{ marginBottom: 8 }}>
            <span style={{ display: "inline-block", border: "2px solid #ff4444", borderRadius: "50%", width: 28, height: 28, lineHeight: "24px", fontWeight: 700, color: "#ff4444", fontSize: 13 }}>18+</span>
          </div>
          <p>Kumar bağımlılık yapabilir. Lütfen sorumlu oynayın.</p>
          <p style={{ marginTop: 4 }}>{campaign.operator} &copy; {new Date().getFullYear()}</p>
        </footer>
      </div>
    </>
  );
}
