"use client";

import { useEffect, useState } from "react";
import GlassCard from "../../components/ui/GlassCard";
import StatusBadge from "../../components/ui/StatusBadge";
import { Plus, Tag, UserCheck } from "lucide-react";

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newType, setNewType] = useState("0");
  const [newReward, setNewReward] = useState("500");
  const [assigningTaskId, setAssigningTaskId] = useState(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  async function loadData() {
    try {
      const tasksRes = await fetch("http://localhost:3001/api/tasks");
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(tasksData.tasks);
      }

      const agentsRes = await fetch("http://localhost:3001/api/agents");
      if (agentsRes.ok) {
        const agentsData = await agentsRes.json();
        setAgents(agentsData.agents.filter((a) => a.status === 1));
      }
    } catch (err) {
      if (tasks.length === 0) {
        setTasks([
          { id: 1, title: "Analyze BTC Sentiment", description: "Audit BTC sentiment from Twitter data", reward: "500", status: 0, taskType: 0, assignedAgentId: 0 },
          { id: 2, title: "Predict ETH Price", description: "4-hour pricing path for ETH/USD", reward: "1,200", status: 1, taskType: 1, assignedAgentId: 2 },
          { id: 3, title: "Risk Assessment Portfolio A", description: "DeFi lending exposure audit", reward: "800", status: 3, taskType: 2, assignedAgentId: 3 },
        ]);
        setAgents([
          { id: 1, name: "AlphaTrader", reputationScore: 8400, status: 1 },
          { id: 2, name: "SentinelAI", reputationScore: 9200, status: 1 },
          { id: 3, name: "RiskGuard", reputationScore: 7800, status: 1 },
        ]);
      }
    } finally {
      setLoading(false);
    }
  }

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTitle || !newDesc) return;

    try {
      const res = await fetch("http://localhost:3001/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          description: newDesc,
          taskType: parseInt(newType),
          reward: newReward,
          inputDataHash: "QmInput" + Math.floor(Math.random() * 1000),
          deadline: Math.floor(Date.now() / 1000) + 86400,
        }),
      });
      if (res.ok) {
        setShowCreateForm(false);
        setNewTitle("");
        setNewDesc("");
        loadData();
      }
    } catch {
      setTasks((prev) => [
        { id: Date.now(), title: newTitle, description: newDesc, reward: newReward, status: 0, taskType: parseInt(newType), assignedAgentId: 0 },
        ...prev,
      ]);
      setShowCreateForm(false);
      setNewTitle("");
      setNewDesc("");
    }
  };

  const handleAssignAgent = async (taskId, agentId) => {
    try {
      const res = await fetch(`http://localhost:3001/api/tasks/${taskId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId }),
      });
      if (res.ok) {
        setAssigningTaskId(null);
        loadData();
      }
    } catch {
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: 1, assignedAgentId: agentId } : t)));
      setAssigningTaskId(null);
    }
  };

  const getTaskTypeLabel = (type) => {
    const types = { 0: "Sentiment", 1: "Price Prediction", 2: "Risk Assessment" };
    return types[type] || "Custom";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-6)", width: "100%", marginTop: "56px", padding: "var(--sp-8)" }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Task Marketplace</h1>
          <p className="page-subtitle">Submit and manage computation workloads.</p>
        </div>
        <button onClick={() => setShowCreateForm(!showCreateForm)} className="btn btn-primary btn-sm">
          <Plus size={14} />
          New Task
        </button>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <GlassCard className="fade-in" style={{ gap: "var(--sp-5)" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "600" }}>New Task</h3>
          <form onSubmit={handleCreateTask} style={{ display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-4)" }}>
              <div>
                <label className="label">Title</label>
                <input type="text" required placeholder="e.g. Audit SOL Sentiment" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">Reward (CMT)</label>
                <input type="number" required placeholder="500" value={newReward} onChange={(e) => setNewReward(e.target.value)} className="input" />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-4)" }}>
              <div>
                <label className="label">Model Type</label>
                <select value={newType} onChange={(e) => setNewType(e.target.value)} className="select">
                  <option value="0">Sentiment Analysis</option>
                  <option value="1">Price Predictor</option>
                  <option value="2">Risk Assessment</option>
                </select>
              </div>
            </div>

            <div>
              <label className="label">Description</label>
              <textarea required placeholder="Details of the computation…" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="textarea" />
            </div>

            <div style={{ display: "flex", gap: "var(--sp-3)" }}>
              <button type="submit" className="btn btn-primary">Submit</button>
              <button type="button" onClick={() => setShowCreateForm(false)} className="btn btn-ghost">Cancel</button>
            </div>
          </form>
        </GlassCard>
      )}

      {/* Tasks */}
      {loading ? (
        <div style={{ textAlign: "center", color: "var(--text-tertiary)", padding: "var(--sp-12)" }}>Loading…</div>
      ) : tasks.length === 0 ? (
        <div style={{ textAlign: "center", color: "var(--text-tertiary)", padding: "var(--sp-12)" }}>No tasks yet.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "2px", background: "var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          {tasks.map((task) => (
            <div
              key={task.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "var(--sp-5) var(--sp-6)",
                background: "var(--bg-surface)",
                gap: "var(--sp-6)",
                flexWrap: "wrap",
              }}
              className="task-row"
            >
              <div style={{ flex: 1, minWidth: "200px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)" }}>
                  <span style={{ fontSize: "14px", fontWeight: "500" }}>{task.title}</span>
                  <StatusBadge status={task.status} type="task" />
                </div>
                <p style={{ fontSize: "12px", color: "var(--text-tertiary)", marginTop: "var(--sp-1)" }}>
                  {task.description}
                </p>
                <div style={{ display: "flex", gap: "var(--sp-4)", marginTop: "var(--sp-2)" }}>
                  <span className="mono" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <Tag size={10} /> {getTaskTypeLabel(task.taskType)}
                  </span>
                  <span className="mono" style={{ color: "var(--success)" }}>
                    {task.reward} CMT
                  </span>
                </div>
              </div>

              {/* Assignment */}
              <div style={{ flexShrink: 0 }}>
                {task.status === 0 ? (
                  assigningTaskId === task.id ? (
                    <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "center" }}>
                      <select
                        onChange={(e) => handleAssignAgent(task.id, e.target.value)}
                        defaultValue=""
                        className="select"
                        style={{ width: "auto", minWidth: "160px" }}
                      >
                        <option value="" disabled>Select agent</option>
                        {agents.map((agent) => (
                          <option key={agent.id} value={agent.id}>{agent.name}</option>
                        ))}
                      </select>
                      <button onClick={() => setAssigningTaskId(null)} className="btn btn-ghost btn-sm">Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => setAssigningTaskId(task.id)} className="btn btn-secondary btn-sm">
                      <UserCheck size={12} /> Assign
                    </button>
                  )
                ) : task.status === 1 ? (
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>Assigned to</div>
                    <div style={{ fontSize: "13px", fontWeight: "500", color: "var(--accent-text)" }}>Agent #{task.assignedAgentId}</div>
                  </div>
                ) : (
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>Completed by</div>
                    <div style={{ fontSize: "13px", fontWeight: "500", color: "var(--success)" }}>Agent #{task.assignedAgentId}</div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx global>{`
        .task-row:hover {
          background: var(--bg-raised) !important;
        }
      `}</style>
    </div>
  );
}
