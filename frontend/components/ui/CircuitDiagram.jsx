"use client";

import { useEffect, useRef, useState } from "react";

export default function CircuitDiagram() {
  const [tick, setTick] = useState(0);
  const animRef = useRef(null);

  useEffect(() => {
    let frame;
    const animate = () => {
      setTick((t) => t + 1);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  const layers = [
    { label: "Input", nodes: 3, x: 60 },
    { label: "Hidden₁", nodes: 5, x: 150 },
    { label: "Hidden₂", nodes: 4, x: 240 },
    { label: "Output", nodes: 1, x: 330 },
  ];

  const getNodeY = (nodeCount, index, height = 150) => {
    const spacing = height / (nodeCount + 1);
    return 20 + spacing * (index + 1);
  };

  // Build all edges
  const edges = [];
  for (let l = 0; l < layers.length - 1; l++) {
    const from = layers[l];
    const to = layers[l + 1];
    for (let i = 0; i < from.nodes; i++) {
      for (let j = 0; j < to.nodes; j++) {
        edges.push({
          x1: from.x,
          y1: getNodeY(from.nodes, i),
          x2: to.x,
          y2: getNodeY(to.nodes, j),
          layer: l,
          id: `${l}-${i}-${j}`,
        });
      }
    }
  }

  // Particle positions — each particle flows along an edge
  const getParticlePos = (edge, time) => {
    // Different speed per layer, staggered by edge index
    const hash = (edge.layer * 17 + parseInt(edge.id.replace(/-/g, ""), 10)) % 60;
    const speed = 0.012 + edge.layer * 0.003;
    const t = ((time * speed + hash * 0.4) % 3.0) / 3.0; // 0 to 1, wrapping
    if (t < 0 || t > 1) return null;
    return {
      x: edge.x1 + (edge.x2 - edge.x1) * t,
      y: edge.y1 + (edge.y2 - edge.y1) * t,
      opacity: Math.sin(t * Math.PI) * 0.9, // fade in/out at ends
    };
  };

  const time = tick * 0.5;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-3)" }}>
      <h4 style={{
        fontSize: "12px",
        fontWeight: "600",
        color: "var(--text-secondary)",
        textTransform: "uppercase",
        letterSpacing: "0.04em",
      }}>
        ZK Circuit Topology
      </h4>

      <div style={{
        background: "#08080a",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        padding: "var(--sp-4)",
        position: "relative",
        overflow: "hidden",
      }}>
        <svg width="100%" height="190" viewBox="0 0 390 190">
          <defs>
            <radialGradient id="particle-glow">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="1" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </radialGradient>
            <filter id="glow-sm">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Connection lines */}
          {edges.map((edge) => (
            <line
              key={edge.id}
              x1={edge.x1}
              y1={edge.y1}
              x2={edge.x2}
              y2={edge.y2}
              stroke="rgba(255,255,255,0.04)"
              strokeWidth="1"
            />
          ))}

          {/* Animated particles flowing along edges */}
          {edges.map((edge) => {
            const pos = getParticlePos(edge, time);
            if (!pos || pos.opacity < 0.05) return null;
            return (
              <circle
                key={`p-${edge.id}`}
                cx={pos.x}
                cy={pos.y}
                r="2"
                fill="var(--accent)"
                opacity={pos.opacity}
                filter="url(#glow-sm)"
              />
            );
          })}

          {/* Nodes */}
          {layers.map((layer, l) =>
            Array.from({ length: layer.nodes }).map((_, i) => {
              const y = getNodeY(layer.nodes, i);
              const isOutput = l === layers.length - 1;
              const isInput = l === 0;
              return (
                <g key={`node-${l}-${i}`}>
                  {/* Node pulse ring for output */}
                  {isOutput && (
                    <circle
                      cx={layer.x}
                      cy={y}
                      r="12"
                      fill="none"
                      stroke="var(--accent)"
                      strokeWidth="1"
                      opacity={0.15 + Math.sin(time * 0.05) * 0.1}
                    />
                  )}
                  <circle
                    cx={layer.x}
                    cy={y}
                    r={isOutput ? 8 : 5}
                    fill={isOutput ? "var(--accent-muted)" : isInput ? "var(--bg-raised)" : "var(--bg-overlay)"}
                    stroke={isOutput ? "var(--accent)" : isInput ? "var(--text-tertiary)" : "rgba(62, 207, 178, 0.4)"}
                    strokeWidth={isOutput ? 2 : 1.5}
                  />
                  {/* Tiny bright core */}
                  {!isInput && (
                    <circle
                      cx={layer.x}
                      cy={y}
                      r="1.5"
                      fill="var(--accent)"
                      opacity={0.3 + Math.sin(time * 0.08 + i) * 0.2}
                    />
                  )}
                </g>
              );
            })
          )}

          {/* Labels */}
          {layers.map((layer) => (
            <text
              key={`label-${layer.label}`}
              x={layer.x}
              y="185"
              textAnchor="middle"
              fontSize="10"
              fill="var(--text-tertiary)"
              fontFamily="var(--font-sans)"
            >
              {layer.label}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}
