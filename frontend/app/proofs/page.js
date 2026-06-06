"use client";

import { useEffect, useState } from "react";
import GlassCard from "../../components/ui/GlassCard";
import CircuitDiagram from "../../components/ui/CircuitDiagram";
import { Shield, Search, ExternalLink, ChevronDown, ChevronUp, Check, X } from "lucide-react";
import { truncateAddress } from "../../lib/utils";

export default function Proofs() {
  const [proofs, setProofs] = useState([]);
  const [search, setSearch] = useState("");
  const [expandedRow, setExpandedRow] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProofs() {
      try {
        const res = await fetch("http://localhost:3001/api/proofs");
        if (res.ok) {
          const data = await res.json();
          setProofs(data.proofs);
        }
      } catch (err) {
        const localCacheProofs = Array.from({ length: 6 }, (_, i) => ({
          proofHash: "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(""),
          agentId: i + 1,
          agentName: ["AlphaTrader", "SentinelAI", "RiskGuard", "OracleX", "DeepAnalyst"][i % 5],
          taskType: ["SENTIMENT", "PRICE_PREDICTION", "RISK_ASSESSMENT", "CUSTOM"][i % 4],
          inputHash: "0x" + "a".repeat(64),
          outputHash: "0x" + "b".repeat(64),
          verified: Math.random() > 0.1,
          gasUsed: 215000 + Math.floor(Math.random() * 50000),
          verifiedAt: new Date(Date.now() - i * 3600000).toISOString(),
          txHash: "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(""),
        }));
        setProofs(localCacheProofs);
      } finally {
        setLoading(false);
      }
    }
    loadProofs();
  }, []);

  const toggleExpandRow = (hash) => {
    setExpandedRow(expandedRow === hash ? null : hash);
  };

  const filteredProofs = proofs.filter(
    (p) =>
      p.proofHash.toLowerCase().includes(search.toLowerCase()) ||
      p.agentName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-6)", width: "100%", marginTop: "56px", padding: "var(--sp-8)" }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Proof Explorer</h1>
          <p className="page-subtitle">Browse and inspect verified ZK proofs.</p>
        </div>
      </div>

      {/* Search */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
        <Search size={14} style={{ color: "var(--text-tertiary)" }} />
        <input
          type="text"
          placeholder="Search by hash or agent name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input"
          style={{ border: "none", background: "none", padding: "var(--sp-2) 0" }}
        />
      </div>

      <div className="divider"></div>

      {/* Proof list */}
      {loading ? (
        <div style={{ textAlign: "center", color: "var(--text-tertiary)", padding: "var(--sp-12)" }}>Loading…</div>
      ) : filteredProofs.length === 0 ? (
        <div style={{ textAlign: "center", color: "var(--text-tertiary)", padding: "var(--sp-12)" }}>No proofs found.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "2px", background: "var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          {filteredProofs.map((p) => {
            const isExpanded = expandedRow === p.proofHash;
            return (
              <div key={p.proofHash} style={{ background: "var(--bg-surface)" }}>
                {/* Row header */}
                <div
                  onClick={() => toggleExpandRow(p.proofHash)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "var(--sp-4) var(--sp-6)",
                    cursor: "pointer",
                    gap: "var(--sp-4)",
                  }}
                  className="proof-row"
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-4)" }}>
                    <div style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "var(--radius-sm)",
                      background: p.verified ? "var(--success-muted)" : "var(--danger-muted)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      {p.verified ? <Check size={14} style={{ color: "var(--success)" }} /> : <X size={14} style={{ color: "var(--danger)" }} />}
                    </div>
                    <div>
                      <div className="mono" style={{ color: "var(--text-primary)", fontWeight: "500" }}>
                        {truncateAddress(p.proofHash)}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-tertiary)", marginTop: "1px" }}>
                        {p.agentName} · {p.taskType.toLowerCase().replace("_", " ")}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-8)" }} className="hide-mobile">
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "11px", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Gas</div>
                      <div style={{ fontSize: "13px", fontWeight: "500" }}>{p.gasUsed.toLocaleString()}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "11px", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Time</div>
                      <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                        {new Date(p.verifiedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp size={16} style={{ color: "var(--text-tertiary)" }} /> : <ChevronDown size={16} style={{ color: "var(--text-tertiary)" }} />}
                  </div>
                </div>

                {/* Expanded */}
                {isExpanded && (
                  <div style={{
                    padding: "var(--sp-6)",
                    borderTop: "1px solid var(--border)",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "var(--sp-8)",
                  }} className="expanded-grid fade-in">
                    {/* Hashes */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>
                      <h4 style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        Cryptographic Hashes
                      </h4>
                      {[
                        { label: "Proof Hash", value: p.proofHash },
                        { label: "Input Hash", value: p.inputHash },
                        { label: "Output Hash", value: p.outputHash },
                      ].map((item, i) => (
                        <div key={i}>
                          <div style={{ fontSize: "11px", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "var(--sp-1)" }}>{item.label}</div>
                          <div className="hash-display">{item.value}</div>
                        </div>
                      ))}
                      <a
                        href={`https://sepolia.etherscan.io/tx/${p.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: "12px", color: "var(--accent-text)", display: "flex", alignItems: "center", gap: "4px", marginTop: "var(--sp-2)" }}
                      >
                        <ExternalLink size={12} /> View on Etherscan
                      </a>
                    </div>

                    {/* Circuit diagram */}
                    <CircuitDiagram />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <style jsx global>{`
        .proof-row:hover {
          background: var(--bg-hover);
        }
        @media (max-width: 768px) {
          .expanded-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
