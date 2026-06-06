const express = require("express");
const router = express.Router();
const blockchainService = require("../services/blockchainService");

// GET /api/agents — List all agents
router.get("/", async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const agents = await blockchainService.getTopAgents(limit);
    res.json({ agents, total: agents.length });
  } catch (error) {
    next(error);
  }
});

// GET /api/agents/:id — Get agent details
router.get("/:id", async (req, res, next) => {
  try {
    const agent = await blockchainService.getAgent(req.params.id);
    res.json(agent);
  } catch (error) {
    next(error);
  }
});

// POST /api/agents — Register new agent
router.post("/", async (req, res, next) => {
  try {
    const { name, modelHash, circuitHash, agentType, stakeAmount } = req.body;
    const result = await blockchainService.registerAgent(
      name, modelHash, circuitHash, agentType, stakeAmount
    );
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

const agentOrchestrator = require("../services/agentOrchestrator");

// GET /api/agents/runners — List running agent runners
router.get("/runners/active", async (req, res, next) => {
  try {
    const running = agentOrchestrator.getRunningAgents();
    res.json({ running });
  } catch (error) {
    next(error);
  }
});

// POST /api/agents/:id/start — Start agent runner
router.post("/:id/start", async (req, res, next) => {
  try {
    const result = await agentOrchestrator.startAgent(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// POST /api/agents/:id/stop — Stop agent runner
router.post("/:id/stop", async (req, res, next) => {
  try {
    const result = await agentOrchestrator.stopAgent(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/agents/:id/runner-status — Get runner status
router.get("/:id/runner-status", async (req, res, next) => {
  try {
    const isRunning = agentOrchestrator.isAgentRunning(req.params.id);
    res.json({ agentId: req.params.id, isRunning });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/agents/:id/status — Update agent status
router.patch("/:id/status", async (req, res, next) => {
  try {
    const { status } = req.body;
    res.json({ agentId: req.params.id, status, updated: true });
  } catch (error) {
    next(error);
  }
});

// GET /api/agents/:id/performance — Get performance metrics
router.get("/:id/performance", async (req, res, next) => {
  try {
    // Mock performance data for MVP
    const days = parseInt(req.query.days) || 30;
    const data = Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.now() - (days - i) * 86400000).toISOString().split("T")[0],
      tasksCompleted: Math.floor(Math.random() * 5),
      successRate: 0.85 + Math.random() * 0.15,
      earnings: (Math.random() * 500).toFixed(2),
      avgResponseTime: (Math.random() * 2000 + 500).toFixed(0),
    }));
    res.json({ agentId: req.params.id, period: `${days}d`, data });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
