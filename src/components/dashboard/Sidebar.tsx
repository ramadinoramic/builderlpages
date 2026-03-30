"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "grid" },
  { href: "/campaigns", label: "Campaigns", icon: "campaigns" },
  { href: "/landers", label: "Landers", icon: "landers" },
];

const NavIcon = ({ type, size = 16 }: { type: string; size?: number }) => {
  const s = { width: size, height: size, strokeWidth: 1.8, fill: "none", stroke: "currentColor" };
  switch (type) {
    case "grid": return <svg {...s} viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
    case "campaigns": return <svg {...s} viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>;
    case "landers": return <svg {...s} viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
    default: return null;
  }
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <aside style={{
        width: collapsed ? 56 : 200,
        minHeight: "100vh",
        background: "#111118",
        borderRight: "1px solid #1e1e2e",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 50,
        transition: "width 0.15s",
      }}>
        {/* Logo */}
        <div style={{
          padding: collapsed ? "16px 12px" : "16px",
          borderBottom: "1px solid #1e1e2e",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <Link href="/dashboard" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 6,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontWeight: 800, fontSize: 13,
            }}>
              LP
            </div>
            {!collapsed && <span style={{ color: "#e4e4f0", fontSize: 15, fontWeight: 600 }}>LPBuilder</span>}
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              background: "none", border: "none", color: "#555", cursor: "pointer",
              fontSize: 14, padding: 2, display: collapsed ? "none" : "block",
            }}
          >
            ‹
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "8px 6px" }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: collapsed ? "9px 12px" : "9px 12px",
                  borderRadius: 6,
                  marginBottom: 1,
                  textDecoration: "none",
                  background: isActive ? "#1e1e2e" : "transparent",
                  color: isActive ? "#e4e4f0" : "#6b6b80",
                  fontSize: 13,
                  fontWeight: isActive ? 500 : 400,
                  transition: "all 0.1s",
                }}
              >
                <NavIcon type={item.icon} />
                {!collapsed && item.label}
              </Link>
            );
          })}
        </nav>

        {/* User / Logout */}
        <div style={{ padding: "8px 6px", borderTop: "1px solid #1e1e2e" }}>
          <button
            onClick={handleLogout}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "9px 12px", width: "100%", borderRadius: 6,
              background: "transparent", border: "none",
              color: "#6b6b80", fontSize: 13, cursor: "pointer",
              textAlign: "left",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            {!collapsed && "Sign out"}
          </button>
        </div>
      </aside>
      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 768px) {
          aside { width: 56px !important; }
          aside span { display: none !important; }
        }
      `}} />
    </>
  );
}
