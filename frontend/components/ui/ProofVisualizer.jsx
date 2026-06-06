"use client";

import { useState, useEffect } from "react";
import { Check, Database, Cpu, Shield, Link2 } from "lucide-react";

export default function ProofVisualizer({ step = 0, autoAnimate = true }) {
  const [animStep, setAnimStep] = useState(autoAnimate ? 0 : step);

  const flowSteps = [
    { label: "Data Input", desc: "Tensor prepared", icon: Database },
    { label: "Inference", desc: "Forward pass executed", icon: Cpu },
    { label: "ZK Proving", desc: "Proof generated", icon: Shield },
    { label: "On-Chain", desc: "Verified & recorded", icon: Link2 },
  ];

  // Auto-animate through steps
  useEffect(() => {
    if (!autoAnimate) {
      setAnimStep(step);
      return;
    }

    setAnimStep(0);
    const timings = [600, 1200, 2000, 2800];

    const timers = timings.map((delay, idx) =>
      setTimeout(() => setAnimStep(idx + 1), delay)
    );

    return () => timers.forEach(clearTimeout);
  }, [step, autoAnimate]);

  return (
    <div className="proof-viz">
      {/* Steps */}
      <div className="proof-viz-steps">
        {flowSteps.map((fStep, index) => {
          const Icon = fStep.icon;
          const isDone = animStep > index;
          const isActive = animStep === index;
          const isWaiting = animStep < index;

          return (
            <div key={index} className="proof-viz-step">
              {/* Connector line */}
              {index > 0 && (
                <div className="proof-viz-connector">
                  <div
                    className="proof-viz-connector-fill"
                    style={{
                      width: isDone || isActive ? "100%" : "0%",
                      background: isDone ? "var(--success)" : isActive ? "var(--accent)" : "transparent",
                    }}
                  />
                </div>
              )}

              {/* Node */}
              <div
                className={`proof-viz-node ${isDone ? "proof-viz-done" : isActive ? "proof-viz-active" : "proof-viz-waiting"}`}
              >
                {isDone ? (
                  <Check size={16} />
                ) : (
                  <Icon size={16} />
                )}
              </div>

              {/* Label */}
              <div className="proof-viz-label">
                <span
                  style={{
                    fontWeight: "600",
                    fontSize: "12px",
                    color: isDone || isActive ? "var(--text-primary)" : "var(--text-tertiary)",
                    transition: "color 300ms var(--ease)",
                  }}
                >
                  {fStep.label}
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    color: isDone ? "var(--success)" : "var(--text-tertiary)",
                    transition: "color 300ms var(--ease)",
                  }}
                >
                  {isDone ? "✓ " : ""}{fStep.desc}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
