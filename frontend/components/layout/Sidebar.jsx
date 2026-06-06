"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Bot, ListTodo, Shield, Landmark } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Agents", href: "/agents", icon: Bot },
    { name: "Tasks", href: "/tasks", icon: ListTodo },
    { name: "Proofs", href: "/proofs", icon: Shield },
    { name: "Governance", href: "/governance", icon: Landmark },
  ];

  return (
    <>
      <aside style={{
        width: "220px",
        position: "fixed",
        top: "56px",
        bottom: 0,
        left: 0,
        background: "var(--bg-surface)",
        borderRight: "1px solid var(--border)",
        padding: "var(--sp-6) var(--sp-3)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        zIndex: 99,
      }}>
        <nav style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--sp-3)",
                  padding: "var(--sp-2) var(--sp-3)",
                  borderRadius: "var(--radius-md)",
                  color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                  background: isActive ? "var(--bg-active)" : "transparent",
                  transition: "all var(--duration) var(--ease)",
                  fontSize: "13px",
                  fontWeight: isActive ? "600" : "400",
                }}
                className={isActive ? "" : "sidebar-link"}
              >
                <IconComponent size={16} style={{ opacity: isActive ? 1 : 0.6 }} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Network status */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--sp-2)",
          padding: "var(--sp-3)",
          fontSize: "11px",
          color: "var(--text-tertiary)",
        }}>
          <span className="dot dot-success dot-pulse"></span>
          Sepolia Testnet
        </div>
      </aside>

      <style jsx global>{`
        .sidebar-link:hover {
          background: var(--bg-hover) !important;
          color: var(--text-primary) !important;
        }
        @media (max-width: 1024px) {
          aside {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}
