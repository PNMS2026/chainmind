"use client";

import { useEffect, useState } from "react";
import GlassCard from "../../components/ui/GlassCard";
import ActivityFeed from "../../components/ui/ActivityFeed";
import StatusBadge from "../../components/ui/StatusBadge";
import { ArrowRight, TrendingUp, TrendingDown } from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalAgents: 12,
    totalProofs: 847,
    activeTasks: 8,
    totalEarnings: "125,430",
  });

  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const statsRes = await fetch("http://localhost:3001/api/analytics/overview");
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }

        const tasksRes = await fetch("http://localhost:3001/api/tasks");
        if (tasksRes.ok) {
          const tasksData = await tasksRes.json();
          setRecentTasks(tasksData.tasks.slice(0, 5));
        }
      } catch (err) {
        setRecentTasks([
          { id: 1, title: "Analyze BTC Sentiment", reward: "500", status: 0, taskType: 0 },
          { id: 2, title: "Predict ETH Price", reward: "1,200", status: 1, taskType: 1 },
          { id: 3, title: "Risk Assessment Portfolio A", reward: "800", status: 3, taskType: 2 },
        ]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const statsItems = [
    { label: "Agents", value: stats.totalAgents, change: "+3", up: true },
    { label: "Proofs Verified", value: stats.totalProofs, change: "+24", up: true },
    { label: "Active Tasks", value: stats.activeTasks, change: "-2", up: false },
    { label: "CMT Earned", value: stats.totalEarnings, change: "+12%", up: true },
  ];

  const latencyData = [120, 150, 110, 160, 130, 95, 140, 125, 115, 105];
  const maxVal = Math.max(...latencyData);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-8)", width: "100%" }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Overview</h1>
          <p className="page-subtitle">Protocol metrics and recent activity.</p>
        </div>
        <Link href="/tasks" className="btn btn-primary btn-sm">
          Create Task
        </Link>
      </div>

      {/* Stats */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "1px",
        background: "var(--border)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
      }}>
        {statsItems.map((item, idx) => (
          <div key={idx} style={{
            background: "var(--bg-surface)",
            padding: "var(--sp-5) var(--sp-6)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--sp-1)",
          }}>
            <span style={{ fontSize: "12px", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {item.label}
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "var(--sp-3)" }}>
              <span style={{ fontSize: "24px", fontWeight: "700", letterSpacing: "-0.02em" }}>
                {item.value}
              </span>
              <span style={{
                fontSize: "12px",
                fontWeight: "500",
                color: item.up ? "var(--success)" : "var(--danger)",
                display: "flex",
                alignItems: "center",
                gap: "2px",
              }}>
                {item.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {item.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Two columns */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1.6fr 1fr",
        gap: "var(--sp-6)",
      }} className="dashboard-grid">
        {/* Left: Tasks + Chart */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-6)" }}>
          {/* Recent tasks */}
          <GlassCard>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-4)" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "600" }}>Recent Tasks</h3>
              <Link href="/tasks" style={{ fontSize: "12px", color: "var(--text-tertiary)", display: "flex", alignItems: "center", gap: "4px" }}>
                View all <ArrowRight size={12} />
              </Link>
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              {loading ? (
                <div style={{ color: "var(--text-tertiary)", textAlign: "center", padding: "var(--sp-8)" }}>Loading…</div>
              ) : recentTasks.length === 0 ? (
                <div style={{ color: "var(--text-tertiary)", textAlign: "center", padding: "var(--sp-8)" }}>No active tasks</div>
              ) : (
                recentTasks.map((task, i) => (
                  <div
                    key={task.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "var(--sp-3) 0",
                      borderTop: i > 0 ? "1px solid var(--border)" : "none",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: "500" }}>{task.title}</div>
                      <div style={{ fontSize: "12px", color: "var(--text-tertiary)", marginTop: "2px" }}>
                        {task.reward} CMT
                      </div>
                    </div>
                    <StatusBadge status={task.status} type="task" />
                  </div>
                ))
              )}
            </div>
          </GlassCard>

          {/* Latency chart */}
          <GlassCard>
            <h3 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "var(--sp-4)" }}>Proof Verification Latency</h3>
            <div style={{
              height: "120px",
              display: "flex",
              alignItems: "flex-end",
              gap: "var(--sp-2)",
            }}>
              {latencyData.map((val, idx) => (
                <div key={idx} style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "var(--sp-1)",
                }}>
                  <span style={{ fontSize: "10px", color: "var(--text-tertiary)" }}>{val}</span>
                  <div style={{
                    width: "100%",
                    height: `${(val / maxVal) * 90}px`,
                    background: "var(--accent-muted)",
                    borderRadius: "3px 3px 0 0",
                    border: "1px solid rgba(62, 207, 178, 0.15)",
                    borderBottom: "none",
                    transition: "height 0.3s var(--ease)",
                  }} />
                </div>
              ))}
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-tertiary)", marginTop: "var(--sp-2)" }}>
              Last 10 verifications · milliseconds
            </div>
          </GlassCard>
        </div>

        {/* Right: Activity */}
        <GlassCard>
          <ActivityFeed />
        </GlassCard>
      </div>

      <style jsx global>{`
        @media (max-width: 1024px) {
          .dashboard-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
