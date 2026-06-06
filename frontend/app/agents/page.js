"use client";

import { useEffect, useState } from "react";
import GlassCard from "../../components/ui/GlassCard";
import StatusBadge from "../../components/ui/StatusBadge";
import { Search, Play, Square, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export default function Agents() {
  const [agents, setAgents] = useState([]);
  const [search, setSearch] = useState("");
  const [runnerStatus, setRunnerStatus] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAgents() {
      try {
        const res = await fetch("http://localhost:3001/api/agents");
        if (res.ok) {
          const data = await res.json();
          setAgents(data.agents);
          data.agents.forEach(async (agent) => {
            try {
              const statusRes = await fetch(`http://localhost:3001/api/agents/${agent.id}/runner-status`);
              if (statusRes.ok) {
                const statusData = await statusRes.json();
                setRunnerStatus((prev) => ({ ...prev, [agent.id]: statusData.isRunning }));
              }
            } catch {}
          });
        }
      } catch (err) {
        setAgents([
          { id: 1, name: "AlphaTrader", stakedAmount: "1500", reputationScore: 8400, agentType: 1, status: 1, totalEarned: "2,500" },
          { id: 2, name: "SentinelAI", stakedAmount: "1000", reputationScore: 9200, agentType: 0, status: 1, totalEarned: "4,120" },
          { id: 3, name: "RiskGuard", stakedAmount: "2000", reputationScore: 7800, agentType: 2, status: 1, totalEarned: "1,800" },
          { id: 4, name: "OracleX", stakedAmount: "1200", reputationScore: 8900, agentType: 3, status: 0, totalEarned: "950" },
        ]);
        setRunnerStatus({ 1: true, 2: false, 3: false, 4: false });
      } finally {
        setLoading(false);
      }
    }
    loadAgents();
  }, []);

  const toggleRunner = async (agentId, e) => {
    e.preventDefault();
    e.stopPropagation();

    const currentlyRunning = runnerStatus[agentId];
    const action = currentlyRunning ? "stop" : "start";

    try {
      const res = await fetch(`http://localhost:3001/api/agents/${agentId}/${action}`, { method: "POST" });
      if (res.ok) {
        setRunnerStatus((prev) => ({ ...prev, [agentId]: !currentlyRunning }));
      }
    } catch {
      setRunnerStatus((prev) => ({ ...prev, [agentId]: !currentlyRunning }));
    }
  };

  const getAgentTypeLabel = (type) => {
    const types = { 0: "Sentiment", 1: "Price Prediction", 2: "Risk Assessment", 3: "Oracle" };
    return types[type] || "Custom";
  };

  const filteredAgents = agents.filter((agent) =>
    agent.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-6)", width: "100%" }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Agents</h1>
          <p className="page-subtitle">Registered AI computation nodes.</p>
        </div>
      </div>

      {/* Search */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--sp-3)",
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--sp-2)",
          flex: 1,
        }}>
          <Search size={14} style={{ color: "var(--text-tertiary)" }} />
          <input
            type="text"
            placeholder="Search agents…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input"
            style={{ border: "none", background: "none", padding: "var(--sp-2) 0" }}
          />
        </div>
        <div className="divider" style={{ height: "auto", width: "1px", alignSelf: "stretch", background: "var(--border)" }}></div>
        <span style={{ fontSize: "12px", color: "var(--text-tertiary)", whiteSpace: "nowrap" }}>
          {filteredAgents.length} agent{filteredAgents.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="divider"></div>

      {/* Agents list */}
      {loading ? (
        <div style={{ textAlign: "center", color: "var(--text-tertiary)", padding: "var(--sp-12)" }}>Loading…</div>
      ) : filteredAgents.length === 0 ? (
        <div style={{ textAlign: "center", color: "var(--text-tertiary)", padding: "var(--sp-12)" }}>No agents found.</div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "var(--sp-4)",
        }}>
          {filteredAgents.map((agent) => {
            const isRunning = runnerStatus[agent.id];
            return (
              <Link href={`/agents/${agent.id}`} key={agent.id} style={{ textDecoration: "none" }}>
                <GlassCard style={{ gap: "var(--sp-4)", height: "100%" }} className="card-interactive">
                  {/* Top row: name + status */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: "600", fontSize: "14px" }}>{agent.name}</span>
                    <StatusBadge status={agent.status} type="agent" />
                  </div>

                  {/* Stats */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-2)" }}>
                    {[
                      { label: "Type", value: getAgentTypeLabel(agent.agentType) },
                      { label: "Reputation", value: (agent.reputationScore / 100).toFixed(0) + "%" },
                      { label: "Earned", value: agent.totalEarned + " CMT" },
                    ].map((row, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                        <span style={{ color: "var(--text-tertiary)" }}>{row.label}</span>
                        <span style={{ color: "var(--text-secondary)", fontWeight: "500" }}>{row.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Runner toggle */}
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderTop: "1px solid var(--border)",
                    paddingTop: "var(--sp-3)",
                    marginTop: "auto",
                  }}>
                    <button
                      onClick={(e) => toggleRunner(agent.id, e)}
                      className={`btn btn-sm ${isRunning ? "btn-danger" : "btn-success"}`}
                    >
                      {isRunning ? <><Square size={10} /> Stop</> : <><Play size={10} /> Start</>}
                    </button>
                    <span style={{
                      fontSize: "11px",
                      color: isRunning ? "var(--success)" : "var(--text-tertiary)",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}>
                      <span className={`dot ${isRunning ? "dot-success dot-pulse" : "dot-neutral"}`}></span>
                      {isRunning ? "Online" : "Offline"}
                    </span>
                  </div>
                </GlassCard>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
