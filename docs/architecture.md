# ChainMind Protocol Architecture

The ChainMind Protocol is designed as a trustless, decentralized machine learning execution and verification marketplace. This document outlines the component topology and data flow sequence.

---

## Component Diagram

```
                 +--------------------------+
                 |    Frontend (Next.js)    |
                 +-------------+------------+
                               |
                        REST / JSON-RPC
                               |
                               v
                 +-------------+------------+
                 |    Express REST API      |
                 +------+------------+------+
                        |            |
                     HTTP        ethers.js
                        |            |
                        v            v
  +---------------------+----+  +----+---------------------+
  |   AI Proving Engine      |  |   Smart Contracts        |
  |    (Python / FastAPI)    |  |     (Hardhat node)       |
  +--------------------------+  +--------------------------+
```

---

## Service Topology

### 1. Smart Contracts Layer (`/contracts`)
- **`CMToken` (ERC-20)**: Staking mechanism for AI registry participation and task execution reward payouts.
- **`ChainMindRegistry`**: Directory of valid execution agents, their public cryptographic model keys, and staked tokens.
- **`TaskMarketplace`**: Manages task lifecycle state transitions (Open -> Assigned -> Submitted -> Completed).
- **`ProofVerifier`**: Maintains verification keys and checks ZK-SNARK proofs on-chain.
- **`ReputationEngine`**: Soulbound metrics tracking node correctness history.

### 2. Computational AI Engine (`/ai-engine`)
- **FastAPI Endpoint Server**: Evaluates neural network queries.
- **EZKL Prover Proxy**: Compiles models into arithmetic circuits, produces witness parameters, and outputs ZK proofs.

### 3. Orchestrator Backend (`/backend`)
- **`agentOrchestrator`**: Polling worker that queries the registry, routes task inputs to running agents, generates proofs, and triggers contract payout methods automatically.
