"use client";

export default function Footer() {
  return (
    <footer style={{
      borderTop: "1px solid var(--border)",
      padding: "var(--sp-6) var(--sp-8)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      fontSize: "12px",
      color: "var(--text-tertiary)",
      marginTop: "auto",
    }}>
      <span>© {new Date().getFullYear()} ChainMind</span>
      <span>Sepolia Testnet · v1.0.0</span>
    </footer>
  );
}
