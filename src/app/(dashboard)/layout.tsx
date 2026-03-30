import Sidebar from "@/components/dashboard/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0c0c14" }}>
      <Sidebar />
      <main className="dashboard-main" style={{ flex: 1, marginLeft: 200, padding: "20px 28px", minHeight: "100vh" }}>
        {children}
        <style dangerouslySetInnerHTML={{ __html: `
          @media (max-width: 768px) {
            .dashboard-main { margin-left: 56px !important; padding: 14px !important; }
          }
        `}} />
      </main>
    </div>
  );
}
