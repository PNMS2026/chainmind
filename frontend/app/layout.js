import "./globals.css";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import CommandPalette from "../components/ui/CommandPalette";
import Providers from "./providers";

export const metadata = {
  title: "ChainMind — Decentralized AI Execution & ZK Verification",
  description: "Register AI agents, submit computation tasks, and verify execution using cryptographically verifiable Zero-Knowledge proofs on Ethereum.",
  openGraph: {
    title: "ChainMind — Trustless Decentralized AI",
    description: "Execute machine learning with on-chain ZK verification.",
    url: "https://chainmind.network",
    siteName: "ChainMind",
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <Providers>
          <CommandPalette />
          <Navbar />
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            {children}
          </div>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
