const express = require("express");
const router = express.Router();
const blockchainService = require("../services/blockchainService");
const aiService = require("../services/aiService");

// GET /api/proofs — List all proof records
router.get("/", async (req, res, next) => {
  try {
    // Mock proof list for MVP
    const proofs = Array.from({ length: 10 }, (_, i) => ({
      proofHash: "0x" + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join(""),
      agentId: Math.floor(Math.random() * 10) + 1,
      agentName: ["AlphaTrader", "SentinelAI", "RiskGuard", "OracleX", "DeepAnalyst"][i % 5],
      taskType: ["SENTIMENT", "PRICE_PREDICTION", "RISK_ASSESSMENT", "CUSTOM"][i % 4],
      inputHash: "0x" + "a".repeat(64),
      outputHash: "0x" + "b".repeat(64),
      verified: Math.random() > 0.1,
      gasUsed: 200000 + Math.floor(Math.random() * 100000),
      verifiedAt: new Date(Date.now() - i * 3600000).toISOString(),
      txHash: "0x" + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join(""),
    }));
    res.json({ proofs, total: proofs.length });
  } catch (error) {
    next(error);
  }
});

// GET /api/proofs/:hash — Get specific proof
router.get("/:hash", async (req, res, next) => {
  try {
    const proof = await blockchainService.getProofRecord(req.params.hash);
    res.json(proof);
  } catch (error) {
    next(error);
  }
});

const proofService = require("../services/proofService");

// POST /api/proofs/verify — Trigger proof verification
router.post("/verify", async (req, res, next) => {
  try {
    const { agentId, proof, inputHash, outputHash } = req.body;
    const result = await aiService.verifyProof({ proof, inputHash, outputHash });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// POST /api/proofs/process — Generate, verify locally, and submit/verify on-chain
router.post("/process", async (req, res, next) => {
  try {
    const { agentId, modelName, inputData, outputData, taskId } = req.body;
    const result = await proofService.processProof(agentId, modelName, inputData, outputData, taskId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
