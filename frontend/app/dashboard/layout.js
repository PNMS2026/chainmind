"use client";

import Sidebar from "../../components/layout/Sidebar";

export default function DashboardLayout({ children }) {
  return (
    <div style={{ display: "flex", minHeight: "calc(100vh - 56px)", marginTop: "56px" }}>
      <Sidebar />

      <main style={{
        flex: 1,
        padding: "var(--sp-8)",
        marginLeft: "220px",
        maxWidth: "100%",
        display: "flex",
        flexDirection: "column",
      }} className="main-content-layout">
        {children}
      </main>

      <style jsx global>{`
        @media (max-width: 1024px) {
          .main-content-layout {
            margin-left: 0 !important;
            padding: var(--sp-6) !important;
          }
        }
      `}</style>
    </div>
  );
}
