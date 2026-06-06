const express = require("express");
const router = express.Router();
const blockchainService = require("../services/blockchainService");

// GET /api/tasks — List tasks
router.get("/", async (req, res, next) => {
  try {
    const tasks = await blockchainService.getOpenTasks();
    res.json({ tasks, total: tasks.length });
  } catch (error) {
    next(error);
  }
});

// GET /api/tasks/:id — Get task details
router.get("/:id", async (req, res, next) => {
  try {
    const task = await blockchainService.getTask(req.params.id);
    res.json(task);
  } catch (error) {
    next(error);
  }
});

// POST /api/tasks — Create new task
router.post("/", async (req, res, next) => {
  try {
    const { title, description, inputDataHash, taskType, reward, deadline } = req.body;
    const result = await blockchainService.createTask(
      title, description, inputDataHash, taskType, reward, deadline
    );
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

// POST /api/tasks/:id/assign — Assign agent to task
router.post("/:id/assign", async (req, res, next) => {
  try {
    const { agentId } = req.body;
    const result = await blockchainService.assignTask(req.params.id, agentId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// POST /api/tasks/:id/submit — Submit result + proof
router.post("/:id/submit", async (req, res, next) => {
  try {
    const { resultHash, proof } = req.body;
    const result = await blockchainService.submitResult(req.params.id, resultHash, proof);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
