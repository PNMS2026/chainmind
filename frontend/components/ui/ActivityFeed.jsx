"use client";

import { useEffect, useState } from "react";
import { Shield, UserPlus, CheckCircle, Zap } from "lucide-react";

export default function ActivityFeed() {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const initialEvents = [
      {
        id: 1,
        title: "Agent registered",
        desc: "AlphaTrader by 0xf39F…2286",
        time: "3m ago",
        icon: UserPlus,
      },
      {
        id: 2,
        title: "Proof verified",
        desc: "price_predictor inference validated",
        time: "10m ago",
        icon: Shield,
      },
      {
        id: 3,
        title: "Task completed",
        desc: "BTC Sentiment Audit → verified",
        time: "15m ago",
        icon: CheckCircle,
      },
      {
        id: 4,
        title: "Agent staked",
        desc: "SentinelAI added 1,500 CMT",
        time: "45m ago",
        icon: Zap,
      },
    ];

    setActivities(initialEvents);

    const interval = setInterval(() => {
      const events = [
        { title: "Proof verified", desc: "risk_scorer inference validated", icon: Shield },
        { title: "Task assigned", desc: "Task #4 → SentinelAI", icon: CheckCircle },
      ];
      const selected = events[Math.floor(Math.random() * events.length)];
      setActivities((prev) => [
        { id: Date.now(), ...selected, time: "now" },
        ...prev.slice(0, 4),
      ]);
    }, 12000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>
      <h3 style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
        Activity
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        {activities.map((act) => {
          const IconComponent = act.icon;
          return (
            <div
              key={act.id}
              style={{
                display: "flex",
                gap: "var(--sp-3)",
                padding: "var(--sp-3)",
                borderRadius: "var(--radius-md)",
                alignItems: "flex-start",
                transition: "background var(--duration) var(--ease)",
              }}
              className="activity-row"
            >
              <IconComponent size={14} style={{ color: "var(--text-tertiary)", marginTop: "2px", flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "13px", fontWeight: "500", color: "var(--text-primary)" }}>{act.title}</div>
                <div style={{ fontSize: "12px", color: "var(--text-tertiary)", marginTop: "1px" }}>{act.desc}</div>
              </div>
              <span style={{ fontSize: "11px", color: "var(--text-tertiary)", whiteSpace: "nowrap", flexShrink: 0 }}>
                {act.time}
              </span>
            </div>
          );
        })}
      </div>

      <style jsx global>{`
        .activity-row:hover {
          background: var(--bg-hover);
        }
      `}</style>
    </div>
  );
}
