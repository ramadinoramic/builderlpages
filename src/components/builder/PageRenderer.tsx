"use client";

import { type BuilderComponent, type BuilderPageData } from "./builder-types";
import { useState, useEffect } from "react";

interface PageRendererProps {
  pageData: BuilderPageData;
  ctaUrl?: string;
  isPreview?: boolean;
}

export default function PageRenderer({ pageData, ctaUrl, isPreview }: PageRendererProps) {
  return (
    <div style={{
      background: pageData.globalStyles.backgroundColor,
      fontFamily: pageData.globalStyles.fontFamily,
      color: pageData.globalStyles.textColor,
      minHeight: isPreview ? undefined : "100vh",
    }}>
      <div style={{ maxWidth: pageData.globalStyles.maxWidth, margin: "0 auto" }}>
        {pageData.components.map((component) => (
          <RenderComponent key={component.id} component={component} ctaUrl={ctaUrl} accentColor={pageData.globalStyles.accentColor} />
        ))}
      </div>
    </div>
  );
}

function RenderComponent({ component, ctaUrl, accentColor }: { component: BuilderComponent; ctaUrl?: string; accentColor: string }) {
  const p = component.props;

  switch (component.type) {
    case "hero":
      return (
        <div style={{
          height: Number(p.height) || 400,
          background: p.backgroundImage
            ? `url(${p.backgroundImage}) center/cover no-repeat`
            : (p.backgroundColor as string) || "#1a1a2e",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: (p.alignment as string) || "center",
        }}>
          {!!p.gradientOverlay && (
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.6) 100%)",
            }} />
          )}
        </div>
      );

    case "headline":
      const headlineStyle: React.CSSProperties = {
        fontSize: Number(p.fontSize) || 48,
        fontWeight: (p.fontWeight as string) || "800",
        textAlign: (p.alignment as React.CSSProperties["textAlign"]) || "center",
        lineHeight: 1.1,
        marginTop: Number(p.marginTop) || 0,
        marginBottom: Number(p.marginBottom) || 16,
        padding: "0 20px",
      };
      if (p.gradientText) {
        headlineStyle.background = `linear-gradient(135deg, ${p.gradientFrom}, ${p.gradientTo})`;
        headlineStyle.WebkitBackgroundClip = "text";
        headlineStyle.WebkitTextFillColor = "transparent";
      } else {
        headlineStyle.color = (p.color as string) || "#fff";
      }
      return <div style={headlineStyle}>{(p.text as string) || "Headline"}</div>;

    case "text":
      return (
        <div style={{
          fontSize: Number(p.fontSize) || 16,
          color: (p.color as string) || "#ccc",
          textAlign: (p.alignment as React.CSSProperties["textAlign"]) || "center",
          lineHeight: Number(p.lineHeight) || 1.6,
          maxWidth: Number(p.maxWidth) || 600,
          margin: "0 auto",
          padding: "0 20px",
          marginTop: Number(p.marginTop) || 0,
          marginBottom: Number(p.marginBottom) || 16,
          whiteSpace: "pre-wrap",
        }}>
          {(p.text as string) || "Text content"}
        </div>
      );

    case "cta-button": {
      const href = (p.url as string) || ctaUrl || "#";
      return (
        <div style={{
          textAlign: (p.alignment as React.CSSProperties["textAlign"]) || "center",
          padding: "0 20px",
          marginTop: Number(p.marginTop) || 8,
          marginBottom: Number(p.marginBottom) || 8,
        }}>
          <a href={href} style={{
            display: p.fullWidth ? "block" : "inline-block",
            background: (p.backgroundColor as string) || accentColor,
            color: (p.textColor as string) || "#fff",
            fontSize: Number(p.fontSize) || 20,
            fontWeight: 700,
            padding: `${Number(p.paddingY) || 18}px ${Number(p.paddingX) || 48}px`,
            borderRadius: Number(p.borderRadius) || 12,
            textDecoration: "none",
            textAlign: "center",
            boxShadow: p.shadow ? `0 4px 24px ${(p.backgroundColor as string) || accentColor}40` : "none",
          }}>
            <div>{(p.text as string) || "Click Here"}</div>
            {!!p.subtext && <div style={{ fontSize: 13, fontWeight: 400, opacity: 0.85, marginTop: 4 }}>{p.subtext as string}</div>}
          </a>
        </div>
      );
    }

    case "image":
      if (!p.src) return (
        <div style={{
          textAlign: (p.alignment as React.CSSProperties["textAlign"]) || "center",
          padding: "0 20px",
          marginTop: Number(p.marginTop) || 8,
          marginBottom: Number(p.marginBottom) || 8,
        }}>
          <div style={{
            display: "inline-block",
            maxWidth: Number(p.maxWidth) || 400,
            width: "100%",
            height: 150,
            borderRadius: Number(p.borderRadius) || 12,
            background: "rgba(255,255,255,0.05)",
            border: "2px dashed rgba(255,255,255,0.15)",
            color: "#666",
            fontSize: 14,
            lineHeight: "150px",
          }}>
            No image URL set
          </div>
        </div>
      );
      return (
        <div style={{
          textAlign: (p.alignment as React.CSSProperties["textAlign"]) || "center",
          padding: "0 20px",
          marginTop: Number(p.marginTop) || 8,
          marginBottom: Number(p.marginBottom) || 8,
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={p.src as string}
            alt={(p.alt as string) || "Image"}
            style={{
              maxWidth: Number(p.maxWidth) || 400,
              width: "100%",
              borderRadius: Number(p.borderRadius) || 12,
            }}
          />
        </div>
      );

    case "steps": {
      const items = Array.isArray(p.items) ? p.items : [];
      return (
        <div style={{
          padding: "0 20px",
          marginTop: Number(p.marginTop) || 16,
          marginBottom: Number(p.marginBottom) || 16,
        }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 8, alignItems: "center" }}>
            {(items as string[]).map((step, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%",
                    background: (p.accentColor as string) || accentColor,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, fontSize: 16, color: (p.stepNumberColor as string) || "#fff",
                  }}>
                    {i + 1}
                  </div>
                  <span style={{ fontSize: 12, color: (p.textColor as string) || "#ccc", textAlign: "center", maxWidth: 80 }}>
                    {step}
                  </span>
                </div>
                {!!p.showConnectors && i < items.length - 1 && (
                  <div style={{ width: 32, height: 2, background: "rgba(255,255,255,0.15)", marginBottom: 20 }} />
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    case "payment-methods": {
      const methods = Array.isArray(p.items) ? p.items : [];
      return (
        <div style={{
          padding: "0 20px",
          marginTop: Number(p.marginTop) || 16,
          marginBottom: Number(p.marginBottom) || 16,
        }}>
          <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 12 }}>
            {(methods as string[]).map((method, i) => (
              <div key={i} style={{
                background: (p.backgroundColor as string) || "#3A3839",
                padding: "8px 16px",
                borderRadius: Number(p.borderRadius) || 8,
                fontSize: 12,
                color: (p.textColor as string) || "#ccc",
                fontWeight: 500,
              }}>
                {method}
              </div>
            ))}
          </div>
        </div>
      );
    }

    case "spacer":
      return <div style={{ height: Number(p.height) || 40 }} />;

    case "divider":
      return (
        <div style={{
          marginTop: Number(p.marginTop) || 16,
          marginBottom: Number(p.marginBottom) || 16,
          display: "flex",
          justifyContent: "center",
        }}>
          <div style={{
            width: `${Number(p.width) || 100}%`,
            height: Number(p.thickness) || 1,
            background: (p.color as string) || "#3a3839",
          }} />
        </div>
      );

    case "testimonial":
      return (
        <div style={{
          margin: `${Number(p.marginTop) || 8}px 20px ${Number(p.marginBottom) || 8}px`,
          background: (p.backgroundColor as string) || "rgba(255,255,255,0.05)",
          borderRadius: Number(p.borderRadius) || 12,
          padding: "20px 24px",
        }}>
          {Number(p.rating) > 0 && (
            <div style={{ marginBottom: 8, fontSize: 18 }}>
              {"★".repeat(Number(p.rating))}{"☆".repeat(5 - Number(p.rating))}
            </div>
          )}
          <p style={{ color: (p.textColor as string) || "#e0e0e0", fontSize: 15, lineHeight: 1.5, margin: "0 0 8px", fontStyle: "italic" }}>
            &ldquo;{p.quote as string}&rdquo;
          </p>
          <p style={{ color: (p.authorColor as string) || "#8888aa", fontSize: 13, margin: 0, fontWeight: 500 }}>
            — {p.author as string}
          </p>
        </div>
      );

    case "countdown":
      return <CountdownComponent props={p} />;

    case "features": {
      const featureItems = Array.isArray(p.items) ? p.items as Array<{ icon: string; title: string; desc: string }> : [];
      const cols = Number(p.columns) || 3;
      return (
        <div style={{
          padding: "0 20px",
          marginTop: Number(p.marginTop) || 16,
          marginBottom: Number(p.marginBottom) || 16,
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: 12,
          }}>
            {featureItems.map((item, i) => (
              <div key={i} style={{
                background: (p.backgroundColor as string) || "rgba(255,255,255,0.03)",
                borderRadius: Number(p.borderRadius) || 12,
                padding: 16,
                textAlign: "center",
              }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: (p.textColor as string) || "#fff", marginBottom: 4 }}>
                  {item.title}
                </div>
                <div style={{ fontSize: 12, color: (p.descColor as string) || "#888" }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case "video":
      if (!p.embedUrl) return (
        <div style={{
          textAlign: (p.alignment as React.CSSProperties["textAlign"]) || "center",
          padding: "0 20px",
          marginTop: Number(p.marginTop) || 16,
          marginBottom: Number(p.marginBottom) || 16,
        }}>
          <div style={{
            maxWidth: Number(p.maxWidth) || 600,
            margin: "0 auto",
            aspectRatio: (p.aspectRatio as string) || "16/9",
            background: "rgba(255,255,255,0.05)",
            borderRadius: Number(p.borderRadius) || 12,
            border: "2px dashed rgba(255,255,255,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#666",
            fontSize: 14,
          }}>
            No video URL set
          </div>
        </div>
      );
      return (
        <div style={{
          textAlign: (p.alignment as React.CSSProperties["textAlign"]) || "center",
          padding: "0 20px",
          marginTop: Number(p.marginTop) || 16,
          marginBottom: Number(p.marginBottom) || 16,
        }}>
          <iframe
            src={p.embedUrl as string}
            style={{
              maxWidth: Number(p.maxWidth) || 600,
              width: "100%",
              aspectRatio: (p.aspectRatio as string) || "16/9",
              borderRadius: Number(p.borderRadius) || 12,
              border: "none",
            }}
            allowFullScreen
          />
        </div>
      );

    case "logo-bar": {
      const logos = Array.isArray(p.items) ? p.items as Array<{ src: string; label: string }> : [];
      return (
        <div style={{
          padding: "0 20px",
          marginTop: Number(p.marginTop) || 16,
          marginBottom: Number(p.marginBottom) || 16,
        }}>
          <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: Number(p.gap) || 24,
            flexWrap: "wrap",
            opacity: Number(p.opacity) || 0.7,
          }}>
            {logos.map((logo, i) => (
              logo.src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={logo.src} alt={logo.label} style={{ maxHeight: Number(p.maxLogoHeight) || 40 }} />
              ) : (
                <span key={i} style={{ fontSize: 12, color: "#666", padding: "8px 12px", background: "rgba(255,255,255,0.05)", borderRadius: 6 }}>
                  {logo.label}
                </span>
              )
            ))}
          </div>
        </div>
      );
    }

    case "faq": {
      const faqItems = Array.isArray(p.items) ? p.items as Array<{ question: string; answer: string }> : [];
      return (
        <div style={{
          padding: "0 20px",
          marginTop: Number(p.marginTop) || 16,
          marginBottom: Number(p.marginBottom) || 16,
        }}>
          {faqItems.map((item, i) => (
            <FaqItem key={i} item={item} backgroundColor={p.backgroundColor as string} questionColor={p.questionColor as string} answerColor={p.answerColor as string} borderRadius={Number(p.borderRadius) || 8} />
          ))}
        </div>
      );
    }

    default:
      return <div style={{ padding: 20, color: "#666", textAlign: "center" }}>Unknown component: {component.type}</div>;
  }
}

// ─── Interactive sub-components ───────────────────────────────────

function CountdownComponent({ props: p }: { props: Record<string, unknown> }) {
  const [time, setTime] = useState({
    h: Number(p.hours) || 0,
    m: Number(p.minutes) || 0,
    s: Number(p.seconds) || 0,
  });

  useEffect(() => {
    const totalSeconds = time.h * 3600 + time.m * 60 + time.s;
    if (totalSeconds <= 0) return;

    const interval = setInterval(() => {
      setTime((prev) => {
        const total = prev.h * 3600 + prev.m * 60 + prev.s - 1;
        if (total <= 0) return { h: 0, m: 0, s: 0 };
        return {
          h: Math.floor(total / 3600),
          m: Math.floor((total % 3600) / 60),
          s: total % 60,
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [time.h, time.m, time.s]);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div style={{
      margin: `${Number(p.marginTop) || 8}px 20px ${Number(p.marginBottom) || 8}px`,
      background: (p.backgroundColor as string) || "rgba(255,0,0,0.1)",
      borderRadius: Number(p.borderRadius) || 12,
      padding: "16px 24px",
      textAlign: "center",
    }}>
      {!!p.label && <div style={{ color: (p.labelColor as string) || "#fff", fontSize: 14, marginBottom: 8, fontWeight: 500 }}>{p.label as string}</div>}
      <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
        {[{ v: pad(time.h), l: "saat" }, { v: pad(time.m), l: "dk" }, { v: pad(time.s), l: "sn" }].map((t, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <div style={{
              fontSize: 32, fontWeight: 800, fontFamily: "monospace",
              color: (p.textColor as string) || "#ff6b6b",
              lineHeight: 1,
            }}>
              {t.v}
            </div>
            <div style={{ fontSize: 10, color: (p.labelColor as string) || "#fff", opacity: 0.6, marginTop: 2 }}>{t.l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FaqItem({ item, backgroundColor, questionColor, answerColor, borderRadius }: {
  item: { question: string; answer: string };
  backgroundColor: string;
  questionColor: string;
  answerColor: string;
  borderRadius: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{
      background: backgroundColor || "rgba(255,255,255,0.03)",
      borderRadius: borderRadius,
      marginBottom: 8,
      overflow: "hidden",
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          padding: "14px 16px",
          background: "transparent",
          border: "none",
          color: questionColor || "#fff",
          fontSize: 14,
          fontWeight: 600,
          textAlign: "left",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {item.question}
        <span style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s", fontSize: 12 }}>▼</span>
      </button>
      {open && (
        <div style={{
          padding: "0 16px 14px",
          color: answerColor || "#aaa",
          fontSize: 13,
          lineHeight: 1.5,
        }}>
          {item.answer}
        </div>
      )}
    </div>
  );
}
