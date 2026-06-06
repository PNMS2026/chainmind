"use client";

import { useState } from "react";
import GlassCard from "../../components/ui/GlassCard";
import { ThumbsUp, ThumbsDown, Info } from "lucide-react";

export default function Governance() {
  const [proposals, setProposals] = useState([
    {
      id: 1,
      title: "CMP-001: Reduce minimum agent stake to 800 CMT",
      desc: "Lower barriers to entry for new agent operators while maintaining network security.",
      proposer: "0xf39F…2286",
      votesFor: 124500,
      votesAgainst: 45000,
      status: "Active",
      endsIn: "2 days",
    },
    {
      id: 2,
      title: "CMP-002: Increase reputation scaling for ZK proofs",
      desc: "Increase proof validation weight to reward high-performance nodes more rapidly.",
      proposer: "0x7099…3122",
      votesFor: 320400,
      votesAgainst: 12000,
      status: "Passed",
      endsIn: "Ended",
    },
  ]);

  const [votePower] = useState("2,500");

  const handleVote = (id, direction) => {
    setProposals((prev) =>
      prev.map((prop) => {
        if (prop.id === id) {
          return {
            ...prop,
            votesFor: direction === "for" ? prop.votesFor + 2500 : prop.votesFor,
            votesAgainst: direction === "against" ? prop.votesAgainst + 2500 : prop.votesAgainst,
          };
        }
        return prop;
      })
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-6)", width: "100%", marginTop: "56px", padding: "var(--sp-8)" }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Governance</h1>
          <p className="page-subtitle">Vote on protocol parameters with CMT.</p>
        </div>
      </div>

      {/* Layout */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "240px 1fr",
        gap: "var(--sp-6)",
      }} className="gov-grid">
        {/* Sidebar: voting power */}
        <div>
          <GlassCard style={{ gap: "var(--sp-4)" }}>
            <div style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Voting Power
            </div>
            <div>
              <span style={{ fontSize: "24px", fontWeight: "700" }}>{votePower}</span>
              <span style={{ fontSize: "13px", color: "var(--text-tertiary)", marginLeft: "var(--sp-2)" }}>CMT</span>
            </div>
            <div style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "var(--sp-2)",
              padding: "var(--sp-3)",
              background: "var(--bg-root)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border)",
              fontSize: "12px",
              color: "var(--text-tertiary)",
              lineHeight: "1.4",
            }}>
              <Info size={14} style={{ flexShrink: 0, marginTop: "1px" }} />
              <span>Agent staking does not affect voting eligibility.</span>
            </div>
          </GlassCard>
        </div>

        {/* Proposals */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>
          <h2 style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Proposals
          </h2>

          {proposals.map((prop) => {
            const totalVotes = prop.votesFor + prop.votesAgainst;
            const pctFor = totalVotes > 0 ? (prop.votesFor / totalVotes) * 100 : 0;

            return (
              <GlassCard key={prop.id} style={{ gap: "var(--sp-4)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--sp-4)" }}>
                  <div>
                    <h3 style={{ fontSize: "14px", fontWeight: "600" }}>{prop.title}</h3>
                    <div style={{ fontSize: "12px", color: "var(--text-tertiary)", marginTop: "var(--sp-1)" }}>
                      {prop.proposer} · Ends {prop.endsIn}
                    </div>
                  </div>
                  <span className={`badge ${prop.status === "Active" ? "badge-info" : "badge-neutral"}`}>
                    {prop.status}
                  </span>
                </div>

                <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                  {prop.desc}
                </p>

                {/* Vote bar */}
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-2)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--text-tertiary)" }}>
                    <span>For: {prop.votesFor.toLocaleString()} ({pctFor.toFixed(0)}%)</span>
                    <span>Against: {prop.votesAgainst.toLocaleString()}</span>
                  </div>
                  <div style={{ height: "4px", background: "var(--bg-root)", borderRadius: "100px", display: "flex", overflow: "hidden" }}>
                    <div style={{ width: `${pctFor}%`, background: "var(--success)", transition: "width 0.3s var(--ease)" }}></div>
                    <div style={{ flex: 1, background: "var(--danger-muted)" }}></div>
                  </div>
                </div>

                {/* Vote buttons */}
                {prop.status === "Active" && (
                  <div style={{ display: "flex", gap: "var(--sp-3)" }}>
                    <button onClick={() => handleVote(prop.id, "for")} className="btn btn-success btn-sm" style={{ flex: 1 }}>
                      <ThumbsUp size={12} /> For
                    </button>
                    <button onClick={() => handleVote(prop.id, "against")} className="btn btn-danger btn-sm" style={{ flex: 1 }}>
                      <ThumbsDown size={12} /> Against
                    </button>
                  </div>
                )}
              </GlassCard>
            );
          })}
        </div>
      </div>

      <style jsx global>{`
        @media (max-width: 768px) {
          .gov-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
