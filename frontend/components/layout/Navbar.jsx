"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Wallet, Menu, X } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const connected = localStorage.getItem("cm_wallet_connected") === "true";
    if (connected) {
      setWalletConnected(true);
      setWalletAddress(localStorage.getItem("cm_wallet_address") || "0xac09...2ff80");
    }
  }, []);

  const handleConnect = () => {
    if (walletConnected) {
      setWalletConnected(false);
      setWalletAddress("");
      localStorage.removeItem("cm_wallet_connected");
      localStorage.removeItem("cm_wallet_address");
    } else {
      const mockAddr = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
      setWalletConnected(true);
      setWalletAddress(mockAddr);
      localStorage.setItem("cm_wallet_connected", "true");
      localStorage.setItem("cm_wallet_address", mockAddr);
    }
  };

  const navLinks = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Agents", href: "/agents" },
    { name: "Tasks", href: "/tasks" },
    { name: "Proofs", href: "/proofs" },
  ];

  const truncated = walletAddress
    ? `${walletAddress.substring(0, 6)}…${walletAddress.substring(walletAddress.length - 4)}`
    : "";

  return (
    <>
      <nav style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "56px",
        zIndex: 1000,
        background: "rgba(12, 12, 14, 0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 var(--sp-6)",
      }}>
        {/* Logo */}
        <Link href="/" style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--sp-2)",
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
          <span style={{
            fontSize: "15px",
            fontWeight: "700",
            letterSpacing: "-0.02em",
            color: "var(--text-primary)",
          }}>ChainMind</span>
        </Link>

        {/* Desktop nav */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }} className="hide-mobile">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  color: isActive ? "var(--text-primary)" : "var(--text-tertiary)",
                  fontSize: "13px",
                  fontWeight: "500",
                  padding: "6px 12px",
                  borderRadius: "var(--radius-md)",
                  background: isActive ? "var(--bg-active)" : "transparent",
                  transition: "all var(--duration) var(--ease)",
                }}
              >
                {link.name}
              </Link>
            );
          })}
        </div>

        {/* Right side */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)" }}>
          <button
            onClick={() => {
              const event = new KeyboardEvent("keydown", { key: "k", metaKey: true, ctrlKey: true, bubbles: true });
              document.dispatchEvent(event);
            }}
            className="cmd-trigger hide-mobile"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "var(--sp-2)",
              padding: "4px 10px",
              background: "var(--bg-raised)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              color: "var(--text-tertiary)",
              fontSize: "12px",
              cursor: "pointer",
              transition: "all var(--duration) var(--ease)",
            }}
          >
            Search
            <kbd style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              padding: "1px 4px",
              background: "var(--bg-root)",
              border: "1px solid var(--border)",
              borderRadius: "3px",
              color: "var(--text-tertiary)",
            }}>⌘K</kbd>
          </button>

          <button onClick={handleConnect} className="btn btn-secondary btn-sm">
            <Wallet size={14} />
            {walletConnected ? truncated : "Connect"}
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="btn btn-ghost btn-sm"
            style={{ display: "none" }}
            id="mobile-toggle"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div style={{
          position: "fixed",
          top: "56px",
          left: 0,
          right: 0,
          background: "var(--bg-surface)",
          borderBottom: "1px solid var(--border)",
          padding: "var(--sp-4)",
          zIndex: 999,
          display: "flex",
          flexDirection: "column",
          gap: "var(--sp-2)",
        }}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              style={{
                padding: "var(--sp-3) var(--sp-4)",
                borderRadius: "var(--radius-md)",
                fontSize: "14px",
                color: "var(--text-primary)",
              }}
            >
              {link.name}
            </Link>
          ))}
        </div>
      )}

      <style jsx global>{`
        @media (max-width: 768px) {
          #mobile-toggle {
            display: inline-flex !important;
          }
        }
      `}</style>
    </>
  );
}
