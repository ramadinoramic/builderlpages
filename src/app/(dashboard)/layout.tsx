import Sidebar from "@/components/dashboard/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0f0f1a" }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: 220, padding: "24px 32px", minHeight: "100vh" }} className="dashboard-main">
        {children}
        <style dangerouslySetInnerHTML={{ __html: `
          @media (max-width: 768px) {
            .dashboard-main { margin-left: 0 !important; padding: 16px !important; padding-top: 56px !important; }
          }
        `}} />
      </main>
    </div>
  );
}
