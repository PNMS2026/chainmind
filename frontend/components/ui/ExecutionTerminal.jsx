"use client";

import { useState, useEffect, useRef } from "react";
import { Terminal as TermIcon, Play, Square } from "lucide-react";

// Simulated log lines for a ZK-ML inference + proof pipeline
function generateLogSequence(agentName, modelName) {
  const randHex = (n) => Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join("");
  const randMs = () => (Math.random() * 200 + 20).toFixed(1);
  const randFloat = () => (Math.random() * 0.9 + 0.1).toFixed(4);

  return [
    { text: `chainmind@${agentName.toLowerCase()} $ run-inference --model ${modelName}`, type: "cmd", delay: 200 },
    { text: `[INFO] Loading ONNX model from IPFS: Qm${randHex(12)}...`, type: "info", delay: 400 },
    { text: `[INFO] Model loaded successfully (${(Math.random() * 2 + 0.5).toFixed(1)} MB)`, type: "info", delay: 600 },
    { text: `[INFO] Input tensor shape: [1, ${modelName === "price_predictor" ? 20 : modelName === "risk_scorer" ? 8 : 10}]`, type: "info", delay: 300 },
    { text: `[EXEC] Running forward pass...`, type: "exec", delay: 800 },
    { text: `  ├─ Layer 0: Linear(in=${modelName === "price_predictor" ? 20 : 10}, out=64)  ${randMs()}ms`, type: "data", delay: 200 },
    { text: `  ├─ Layer 1: ReLU                              ${randMs()}ms`, type: "data", delay: 150 },
    { text: `  ├─ Layer 2: Linear(in=64, out=32)             ${randMs()}ms`, type: "data", delay: 200 },
    { text: `  ├─ Layer 3: ReLU                              ${randMs()}ms`, type: "data", delay: 150 },
    { text: `  └─ Layer 4: Linear(in=32, out=1)              ${randMs()}ms`, type: "data", delay: 200 },
    { text: `[RESULT] Output: [${randFloat()}]`, type: "success", delay: 400 },
    { text: ``, type: "blank", delay: 200 },
    { text: `chainmind@${agentName.toLowerCase()} $ ezkl gen-witness`, type: "cmd", delay: 300 },
    { text: `[ZK] Generating witness from inference trace...`, type: "info", delay: 600 },
    { text: `[ZK] Witness generated: ${(Math.random() * 100 + 50).toFixed(0)} constraints`, type: "info", delay: 500 },
    { text: `[ZK] Circuit compilation: R1CS → Halo2 backend`, type: "info", delay: 400 },
    { text: ``, type: "blank", delay: 200 },
    { text: `chainmind@${agentName.toLowerCase()} $ ezkl prove --srs-path kzg.srs`, type: "cmd", delay: 300 },
    { text: `[ZK] Proving with KZG commitment scheme...`, type: "exec", delay: 1200 },
    { text: `[ZK] ████████████████████████████████ 100%`, type: "progress", delay: 800 },
    { text: `[ZK] Proof generated in ${(Math.random() * 200 + 80).toFixed(1)}ms`, type: "success", delay: 400 },
    { text: `[ZK] Proof hash: 0x${randHex(32)}...`, type: "data", delay: 300 },
    { text: ``, type: "blank", delay: 200 },
    { text: `chainmind@${agentName.toLowerCase()} $ ezkl verify --proof proof.json`, type: "cmd", delay: 300 },
    { text: `[VERIFY] Checking proof against verification key...`, type: "info", delay: 500 },
    { text: `[VERIFY] Public inputs validated ✓`, type: "success", delay: 300 },
    { text: `[VERIFY] Commitment opening verified ✓`, type: "success", delay: 300 },
    { text: `[VERIFY] Proof VALID ✓`, type: "success", delay: 300 },
    { text: ``, type: "blank", delay: 200 },
    { text: `chainmind@${agentName.toLowerCase()} $ submit-onchain --network sepolia`, type: "cmd", delay: 300 },
    { text: `[TX] Broadcasting to ProofVerifier contract...`, type: "info", delay: 800 },
    { text: `[TX] Transaction hash: 0x${randHex(32)}...`, type: "data", delay: 600 },
    { text: `[TX] Confirmed in block #${(18000000 + Math.floor(Math.random() * 100000)).toLocaleString()}`, type: "success", delay: 500 },
    { text: `[TX] Gas used: ${(215000 + Math.floor(Math.random() * 50000)).toLocaleString()} wei`, type: "data", delay: 300 },
    { text: ``, type: "blank", delay: 200 },
    { text: `✅ Session complete. Proof verified and recorded on-chain.`, type: "final", delay: 400 },
  ];
}

export default function ExecutionTerminal({ agentName = "Agent", modelName = "sentiment_model" }) {
  const [lines, setLines] = useState([]);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const scrollRef = useRef(null);
  const cancelRef = useRef(false);

  const runSimulation = async () => {
    if (running) return;
    setLines([]);
    setRunning(true);
    setFinished(false);
    cancelRef.current = false;

    const sequence = generateLogSequence(agentName, modelName);

    for (let i = 0; i < sequence.length; i++) {
      if (cancelRef.current) break;
      await new Promise((r) => setTimeout(r, sequence[i].delay));
      if (cancelRef.current) break;
      setLines((prev) => [...prev, sequence[i]]);
    }

    setRunning(false);
    setFinished(true);
  };

  const stopSimulation = () => {
    cancelRef.current = true;
    setRunning(false);
  };

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  const getLineColor = (type) => {
    switch (type) {
      case "cmd": return "var(--accent)";
      case "exec": return "var(--warning)";
      case "success": return "var(--success)";
      case "final": return "var(--success)";
      case "data": return "var(--text-secondary)";
      case "progress": return "var(--accent)";
      case "info": return "var(--text-tertiary)";
      case "blank": return "transparent";
      default: return "var(--text-tertiary)";
    }
  };

  return (
    <div className="terminal">
      {/* Terminal header */}
      <div className="terminal-header">
        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
          <TermIcon size={14} style={{ color: "var(--text-tertiary)" }} />
          <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)" }}>Execution Terminal</span>
        </div>
        <div style={{ display: "flex", gap: "var(--sp-2)" }}>
          {!running ? (
            <button onClick={runSimulation} className="btn btn-success btn-sm" style={{ padding: "2px 10px", fontSize: "11px" }}>
              <Play size={10} /> {finished ? "Replay" : "Run"}
            </button>
          ) : (
            <button onClick={stopSimulation} className="btn btn-danger btn-sm" style={{ padding: "2px 10px", fontSize: "11px" }}>
              <Square size={10} /> Stop
            </button>
          )}
        </div>
      </div>

      {/* Terminal body */}
      <div className="terminal-body" ref={scrollRef}>
        {lines.length === 0 && !running && (
          <div style={{ color: "var(--text-tertiary)", fontStyle: "italic" }}>
            Press Run to simulate a ZK-ML inference pipeline…
          </div>
        )}
        {lines.map((line, i) => (
          <div key={i} className={`terminal-line ${line.type === "cmd" ? "terminal-cmd" : ""}`}>
            <span style={{ color: getLineColor(line.type) }}>{line.text}</span>
          </div>
        ))}
        {running && (
          <span className="terminal-cursor">▋</span>
        )}
      </div>
    </div>
  );
}
