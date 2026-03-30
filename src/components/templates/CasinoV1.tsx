"use client";

import { type LPTemplateProps } from "@/lib/types";

export default function CasinoV1({ variant, campaign }: LPTemplateProps) {
  return (
    <>
      {variant.custom_css && <style dangerouslySetInnerHTML={{ __html: variant.custom_css }} />}
      <div className="casino-v1" style={{ background: "#2d2a2b", minHeight: "100vh", color: "#fff", fontFamily: "'Inter', sans-serif" }}>
        {/* Header */}
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", background: "#1e1c1d", borderBottom: "1px solid #3a3839" }}>
          <div style={{ width: 40 }} />
          <div style={{ fontWeight: 700, fontSize: 24, letterSpacing: 1, color: "#fff" }}>
            {campaign.operator || "Casino"}
          </div>
          <div style={{ fontSize: 12, color: "#888", cursor: "pointer" }}>
            Giriş
          </div>
        </header>

        {/* Hero Section */}
        <div style={{
          position: "relative",
          background: `linear-gradient(135deg, #3A3839 0%, #2d2a2b 50%, #1e1c1d 100%)`,
          padding: "40px 20px 60px",
          textAlign: "center",
          overflow: "hidden",
        }}>
          {/* Decorative floating elements */}
          <div className="casino-float casino-float-1" style={{ position: "absolute", top: "10%", left: "5%", fontSize: 40, opacity: 0.15, animation: "casinoFloat 6s ease-in-out infinite" }}>
            🎰
          </div>
          <div className="casino-float casino-float-2" style={{ position: "absolute", top: "20%", right: "8%", fontSize: 36, opacity: 0.12, animation: "casinoFloat 8s ease-in-out infinite 1s" }}>
            🃏
          </div>
          <div className="casino-float casino-float-3" style={{ position: "absolute", bottom: "15%", left: "10%", fontSize: 32, opacity: 0.1, animation: "casinoFloat 7s ease-in-out infinite 2s" }}>
            💎
          </div>
          <div className="casino-float casino-float-4" style={{ position: "absolute", bottom: "25%", right: "5%", fontSize: 38, opacity: 0.13, animation: "casinoFloat 9s ease-in-out infinite 0.5s" }}>
            🎲
          </div>

          {variant.hero_image_url && (
            <img
              src={variant.hero_image_url}
              alt="Hero"
              style={{ maxWidth: 280, margin: "0 auto 20px", display: "block" }}
            />
          )}

          {/* Promo Banner */}
          <div style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)",
            borderRadius: 16,
            padding: "32px 20px",
            maxWidth: 400,
            margin: "0 auto",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}>
            <div style={{
              fontSize: 48,
              fontWeight: 800,
              lineHeight: 1.1,
              background: "linear-gradient(135deg, #FFD700, #FFA500)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              marginBottom: 8,
            }}>
              {variant.headline || "₺15.000"}
            </div>
            <div style={{
              fontSize: 18,
              fontWeight: 600,
              color: "#e0e0e0",
              letterSpacing: 1.5,
              textTransform: "uppercase",
            }}>
              {variant.subheadline || "Hoş Geldin Bonusu"}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div style={{ padding: "0 20px", marginTop: -24, position: "relative", zIndex: 10 }}>
          <a
            href={variant.cta_url || "#"}
            style={{
              display: "block",
              maxWidth: 400,
              margin: "0 auto",
              background: variant.cta_color || "#00ca6b",
              color: "#fff",
              textAlign: "center",
              padding: "18px 24px",
              borderRadius: 12,
              textDecoration: "none",
              fontWeight: 700,
              fontSize: 20,
              boxShadow: `0 4px 24px ${variant.cta_color || "#00ca6b"}40`,
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
          >
            <div>{variant.cta_text || "Şimdi Katıl"}</div>
            {variant.cta_subtext && (
              <div style={{ fontSize: 13, fontWeight: 400, opacity: 0.85, marginTop: 4 }}>
                {variant.cta_subtext}
              </div>
            )}
          </a>
        </div>

        {/* Body text */}
        {variant.body_text && (
          <div style={{ padding: "24px 20px", maxWidth: 400, margin: "0 auto", color: "#ccc", fontSize: 14, lineHeight: 1.6, textAlign: "center" }}>
            {variant.body_text}
          </div>
        )}

        {/* Steps */}
        {variant.steps && variant.steps.length > 0 && (
          <div style={{ padding: "32px 20px", maxWidth: 400, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "center", gap: 8, alignItems: "center" }}>
              {variant.steps.map((step, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                  }}>
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: variant.cta_color || "#00ca6b",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: 16,
                    }}>
                      {i + 1}
                    </div>
                    <span style={{ fontSize: 12, color: "#ccc", textAlign: "center", maxWidth: 80 }}>
                      {step}
                    </span>
                  </div>
                  {i < variant.steps.length - 1 && (
                    <div style={{ width: 32, height: 2, background: "#52535B", marginBottom: 20 }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment Methods */}
        {variant.payment_methods && variant.payment_methods.length > 0 && (
          <div style={{ padding: "24px 20px", borderTop: "1px solid #3a3839" }}>
            <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 16 }}>
              {variant.payment_methods.map((method, i) => (
                <div key={i} style={{
                  background: "#3A3839",
                  padding: "8px 16px",
                  borderRadius: 8,
                  fontSize: 12,
                  color: "#ccc",
                  fontWeight: 500,
                }}>
                  {method}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer style={{
          padding: "32px 20px",
          borderTop: "1px solid #3a3839",
          textAlign: "center",
          color: "#666",
          fontSize: 11,
          lineHeight: 1.6,
        }}>
          <div style={{ marginBottom: 8 }}>
            <span style={{
              display: "inline-block",
              border: "2px solid #ff4444",
              borderRadius: "50%",
              width: 28,
              height: 28,
              lineHeight: "24px",
              fontWeight: 700,
              color: "#ff4444",
              fontSize: 13,
            }}>
              18+
            </span>
          </div>
          <p>Kumar bağımlılık yapabilir. Lütfen sorumlu oynayın.</p>
          <p style={{ marginTop: 4 }}>
            {campaign.operator || "Operator"} &copy; {new Date().getFullYear()}. Tüm hakları saklıdır.
          </p>
        </footer>

        {/* Sticky mobile CTA */}
        <div className="casino-v1-sticky-cta" style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "12px 20px",
          background: "linear-gradient(transparent, #2d2a2b 30%)",
          zIndex: 50,
        }}>
          <a
            href={variant.cta_url || "#"}
            style={{
              display: "block",
              maxWidth: 400,
              margin: "0 auto",
              background: variant.cta_color || "#00ca6b",
              color: "#fff",
              textAlign: "center",
              padding: "14px 24px",
              borderRadius: 10,
              textDecoration: "none",
              fontWeight: 700,
              fontSize: 16,
              boxShadow: `0 4px 20px ${variant.cta_color || "#00ca6b"}50`,
            }}
          >
            {variant.cta_text || "Şimdi Katıl"}
          </a>
        </div>

        {/* Bottom spacer for sticky CTA */}
        <div style={{ height: 80 }} />
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes casinoFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(10deg); }
        }
        @media (min-width: 768px) {
          .casino-v1-sticky-cta { display: none !important; }
        }
      `}} />
    </>
  );
}
