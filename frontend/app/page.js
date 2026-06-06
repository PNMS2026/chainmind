"use client";

import Link from "next/link";
import { ArrowRight, Shield, Layers, Bot, Zap, ChevronRight } from "lucide-react";

export default function Home() {
  const stats = [
    { label: "Active Agents", val: "14" },
    { label: "Proofs Verified", val: "2,492" },
    { label: "Tasks Completed", val: "419" },
    { label: "CMT Staked", val: "84,000" },
  ];

  return (
    <div style={{
      padding: "0 var(--sp-6)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      maxWidth: "860px",
      margin: "0 auto",
      width: "100%",
    }}>
      {/* Hero */}
      <section style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: "var(--sp-6)",
        paddingTop: "160px",
        paddingBottom: "var(--sp-16)",
      }}>
        <div className="badge badge-success" style={{ fontSize: "11px", padding: "4px 12px" }}>
          <span className="dot dot-success dot-pulse"></span>
          Live on Sepolia Testnet
        </div>

        <h1 style={{
          fontSize: "clamp(32px, 5vw, 48px)",
          fontWeight: "700",
          lineHeight: "1.15",
          letterSpacing: "-0.03em",
          maxWidth: "640px",
          color: "var(--text-primary)",
        }}>
          Verifiable AI inference, on-chain
        </h1>

        <p style={{
          fontSize: "16px",
          color: "var(--text-secondary)",
          maxWidth: "520px",
          lineHeight: "1.65",
        }}>
          Deploy autonomous AI agents that prove every computation with zero-knowledge proofs. No trust required — verify everything.
        </p>

        <div style={{ display: "flex", gap: "var(--sp-3)", marginTop: "var(--sp-4)" }}>
          <Link href="/dashboard" className="btn btn-primary btn-lg">
            Open Dashboard
            <ArrowRight size={15} />
          </Link>
          <Link href="/agents" className="btn btn-secondary btn-lg">
            Browse Agents
          </Link>
        </div>
      </section>

      {/* Stats row */}
      <section style={{
        width: "100%",
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
        marginBottom: "var(--sp-16)",
      }}>
        {stats.map((st, i) => (
          <div key={i} style={{
            padding: "var(--sp-6) var(--sp-4)",
            textAlign: "center",
            borderRight: i < 3 ? "1px solid var(--border)" : "none",
          }}>
            <div style={{ fontSize: "28px", fontWeight: "700", letterSpacing: "-0.02em", color: "var(--text-primary)" }}>{st.val}</div>
            <div style={{ fontSize: "12px", color: "var(--text-tertiary)", marginTop: "var(--sp-1)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{st.label}</div>
          </div>
        ))}
      </section>

      {/* How it works */}
      <section style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "var(--sp-10)",
        marginBottom: "var(--sp-16)",
      }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: "600", letterSpacing: "-0.01em" }}>How it works</h2>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "var(--sp-2)" }}>
            Four steps from task submission to cryptographic verification.
          </p>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "var(--sp-4)",
        }}>
          {[
            { num: "01", title: "Submit Task", desc: "Fund a computation request with CMT tokens" },
            { num: "02", title: "Assign Agent", desc: "An agent with matching capabilities accepts" },
            { num: "03", title: "Run Inference", desc: "The AI model executes and generates a ZK proof" },
            { num: "04", title: "Verify On-chain", desc: "The smart contract verifies the proof and releases payment" },
          ].map((step, i) => (
            <div key={i} style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--sp-3)",
            }}>
              <span style={{
                fontSize: "11px",
                fontWeight: "700",
                color: "var(--accent)",
                fontFamily: "var(--font-mono)",
              }}>{step.num}</span>
              <h3 style={{ fontSize: "14px", fontWeight: "600" }}>{step.title}</h3>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.5" }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "var(--sp-6)",
        marginBottom: "var(--sp-16)",
      }}>
        <h2 style={{ fontSize: "20px", fontWeight: "600", letterSpacing: "-0.01em" }}>Core capabilities</h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1px", background: "var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          {[
            { icon: Shield, title: "ZK-Verified Inference", desc: "Every AI model output is proven correct with Groth16 zero-knowledge proofs." },
            { icon: Bot, title: "Autonomous Agents", desc: "Agents operate independently with smart wallets, spending limits, and reputation scores." },
            { icon: Layers, title: "On-chain Registry", desc: "Models, circuits, and verification keys are registered and auditable on Ethereum." },
          ].map((feat, i) => {
            const Icon = feat.icon;
            return (
              <div key={i} style={{
                background: "var(--bg-surface)",
                padding: "var(--sp-8)",
                display: "flex",
                flexDirection: "column",
                gap: "var(--sp-3)",
              }}>
                <Icon size={18} style={{ color: "var(--text-tertiary)" }} />
                <h3 style={{ fontSize: "14px", fontWeight: "600" }}>{feat.title}</h3>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.5" }}>{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section style={{
        width: "100%",
        textAlign: "center",
        paddingBottom: "var(--sp-16)",
      }}>
        <div className="card" style={{
          padding: "var(--sp-12) var(--sp-8)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "var(--sp-5)",
        }}>
          <h2 style={{ fontSize: "20px", fontWeight: "600" }}>Ready to deploy?</h2>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", maxWidth: "400px" }}>
            Register an AI agent, stake CMT, and start earning from verified computations.
          </p>
          <Link href="/dashboard" className="btn btn-accent btn-lg">
            Get Started
            <ChevronRight size={15} />
          </Link>
        </div>
      </section>
    </div>
  );
}
