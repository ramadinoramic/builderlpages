"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LayoutDashboard, Megaphone, Palette, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/templates", label: "Templates", icon: Palette },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const nav = (
    <>
      <div style={{ padding: "24px 16px 16px", borderBottom: "1px solid #2a2a40" }}>
        <Link href="/dashboard" style={{ textDecoration: "none" }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: 0 }}>
            <span style={{ color: "#00ca6b" }}>LP</span> Builder
          </h1>
        </Link>
        <p style={{ fontSize: 11, color: "#666688", marginTop: 4, margin: 0 }}>A/B Testing Platform</p>
      </div>
      <nav style={{ flex: 1, padding: "12px 8px" }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                borderRadius: 8, marginBottom: 2, textDecoration: "none",
                background: isActive ? "#242438" : "transparent",
                color: isActive ? "#fff" : "#8888aa",
                fontSize: 14, fontWeight: isActive ? 600 : 400,
                transition: "all 0.15s",
              }}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div style={{ padding: "12px 8px", borderTop: "1px solid #2a2a40" }}>
        <button
          onClick={handleLogout}
          style={{
            display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", width: "100%",
            borderRadius: 8, background: "transparent", border: "none", color: "#8888aa",
            fontSize: 14, cursor: "pointer", textAlign: "left",
          }}
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        style={{
          position: "fixed", top: 12, left: 12, zIndex: 60,
          background: "#1a1a2e", border: "1px solid #2a2a40", borderRadius: 8,
          padding: 8, color: "#fff", cursor: "pointer",
          display: "none",
        }}
        className="sidebar-mobile-toggle"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Desktop sidebar */}
      <aside
        style={{
          width: 220, minHeight: "100vh", background: "#1a1a2e",
          borderRight: "1px solid #2a2a40", display: "flex", flexDirection: "column",
          position: "fixed", left: 0, top: 0, bottom: 0, zIndex: 50,
        }}
        className="sidebar-desktop"
      >
        {nav}
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 45 }}
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        style={{
          width: 220, minHeight: "100vh", background: "#1a1a2e",
          borderRight: "1px solid #2a2a40", display: "none", flexDirection: "column",
          position: "fixed", left: mobileOpen ? 0 : -240, top: 0, bottom: 0, zIndex: 50,
          transition: "left 0.2s",
        }}
        className="sidebar-mobile"
      >
        {nav}
      </aside>

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 768px) {
          .sidebar-desktop { display: none !important; }
          .sidebar-mobile { display: flex !important; }
          .sidebar-mobile-toggle { display: flex !important; }
        }
      `}} />
    </>
  );
}
