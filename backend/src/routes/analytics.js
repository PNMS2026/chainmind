const express = require("express");
const router = express.Router();
const blockchainService = require("../services/blockchainService");

// GET /api/analytics/overview — Dashboard stats
router.get("/overview", async (req, res, next) => {
  try {
    const stats = await blockchainService.getDashboardStats();
    res.json({
      totalAgents: stats.totalAgents,
      activeTasks: stats.activeTasks,
      proofsVerified24h: 47,
      totalEarnings: stats.totalEarnings,
      trends: {
        agents: { value: 12, direction: "up" },
        tasks: { value: 8, direction: "up" },
        proofs: { value: 23, direction: "up" },
        earnings: { value: 15, direction: "up" },
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/activity — Recent activity feed
router.get("/activity", async (req, res, next) => {
  try {
    const activities = [
      { type: "agent_registered", description: "AlphaTrader registered", timestamp: new Date(Date.now() - 300000).toISOString(), txHash: "0xabc...def" },
      { type: "task_completed", description: "Sentiment Analysis completed by SentinelAI", timestamp: new Date(Date.now() - 900000).toISOString(), txHash: "0x123...456" },
      { type: "proof_verified", description: "ZK proof verified for Task #42", timestamp: new Date(Date.now() - 1800000).toISOString(), txHash: "0x789...012" },
      { type: "reward_claimed", description: "RiskGuard claimed 500 CMT reward", timestamp: new Date(Date.now() - 3600000).toISOString(), txHash: "0xdef...abc" },
      { type: "task_created", description: "New Price Prediction task created", timestamp: new Date(Date.now() - 5400000).toISOString(), txHash: "0x456...789" },
      { type: "agent_registered", description: "OracleX registered as Oracle agent", timestamp: new Date(Date.now() - 7200000).toISOString(), txHash: "0xfed...cba" },
      { type: "proof_verified", description: "ZK proof verified for Task #39", timestamp: new Date(Date.now() - 10800000).toISOString(), txHash: "0x321...654" },
      { type: "task_completed", description: "Risk Assessment completed by QuantumTrader", timestamp: new Date(Date.now() - 14400000).toISOString(), txHash: "0x987...321" },
    ];
    res.json({ activities });
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/leaderboard — Agent leaderboard
router.get("/leaderboard", async (req, res, next) => {
  try {
    const leaderboard = [
      { rank: 1, name: "AlphaTrader", agentId: 1, tasksCompleted: 127, successRate: 0.98, earnings: "42,350" },
      { rank: 2, name: "SentinelAI", agentId: 2, tasksCompleted: 98, successRate: 0.96, earnings: "31,200" },
      { rank: 3, name: "RiskGuard", agentId: 3, tasksCompleted: 85, successRate: 0.94, earnings: "27,800" },
      { rank: 4, name: "OracleX", agentId: 4, tasksCompleted: 72, successRate: 0.92, earnings: "22,100" },
      { rank: 5, name: "DeepAnalyst", agentId: 5, tasksCompleted: 64, successRate: 0.91, earnings: "18,750" },
      { rank: 6, name: "QuantumTrader", agentId: 6, tasksCompleted: 51, successRate: 0.89, earnings: "15,300" },
      { rank: 7, name: "NeuralScout", agentId: 7, tasksCompleted: 43, successRate: 0.87, earnings: "12,800" },
      { rank: 8, name: "ProofMaster", agentId: 8, tasksCompleted: 38, successRate: 0.95, earnings: "11,200" },
      { rank: 9, name: "DataSage", agentId: 9, tasksCompleted: 29, successRate: 0.86, earnings: "8,900" },
      { rank: 10, name: "CryptoOwl", agentId: 10, tasksCompleted: 21, successRate: 0.90, earnings: "6,400" },
    ];
    res.json({ leaderboard });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
