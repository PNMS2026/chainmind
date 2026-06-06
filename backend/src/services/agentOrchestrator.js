const blockchainService = require("./blockchainService");
const aiService = require("./aiService");
const proofService = require("./proofService");

/**
 * AgentOrchestrator — Coordinates agent execution, task monitoring, and automated processing
 */
class AgentOrchestrator {
  constructor() {
    this.runningAgents = new Set(); // Set of agent IDs that are active/polling
    this.pollingInterval = null;
    this.isPolling = false;
  }

  /**
   * Start an agent runner
   * @param {string|number} agentId 
   */
  async startAgent(agentId) {
    const id = Number(agentId);
    if (this.runningAgents.has(id)) {
      console.log(`🤖 Agent #${id} is already running`);
      return { success: true, message: `Agent #${id} is already running` };
    }

    try {
      // Validate agent exists on-chain
      const agent = await blockchainService.getAgent(id);
      if (!agent || agent.status !== 1) { // 1 = ACTIVE
        throw new Error(`Agent #${id} is not active or does not exist`);
      }

      this.runningAgents.add(id);
      console.log(`🚀 Started runner for Agent #${id} (${agent.name})`);

      // Start global polling if not already started
      this.startPolling();

      return { success: true, message: `Agent #${id} runner started` };
    } catch (error) {
      console.error(`❌ Failed to start Agent #${id}:`, error.message);
      throw error;
    }
  }

  /**
   * Stop an agent runner
   * @param {string|number} agentId 
   */
  async stopAgent(agentId) {
    const id = Number(agentId);
    if (!this.runningAgents.has(id)) {
      console.log(`🤖 Agent #${id} is not running`);
      return { success: true, message: `Agent #${id} is not running` };
    }

    this.runningAgents.delete(id);
    console.log(`🛑 Stopped runner for Agent #${id}`);

    if (this.runningAgents.size === 0) {
      this.stopPolling();
    }

    return { success: true, message: `Agent #${id} runner stopped` };
  }

  /**
   * Check if an agent is running
   * @param {string|number} agentId 
   */
  isAgentRunning(agentId) {
    return this.runningAgents.has(Number(agentId));
  }

  /**
   * Get list of all currently running agents
   */
  getRunningAgents() {
    return Array.from(this.runningAgents);
  }

  /**
   * Process a single task assigned to an agent
   * @param {string|number} taskId 
   * @param {string|number} agentId 
   */
  async processTask(taskId, agentId) {
    console.log(`⚙️  Processing task #${taskId} with agent #${agentId}...`);
    try {
      const task = await blockchainService.getTask(taskId);
      const agent = await blockchainService.getAgent(agentId);

      // Map task type to model names we have configured
      // taskType: 0 = SENTIMENT, 1 = PRICE_PREDICTION, 2 = RISK_ASSESSMENT
      const modelMap = {
        0: "sentiment_model",
        1: "price_predictor",
        2: "risk_scorer"
      };
      
      const modelName = modelMap[task.taskType] || "sentiment_model";
      
      // Generate some input data based on task description or fallback to deterministic inputs
      const inputDimMap = {
        "sentiment_model": 10,
        "price_predictor": 20,
        "risk_scorer": 8
      };
      const inputDim = inputDimMap[modelName] || 10;
      const inputData = Array.from({ length: inputDim }, (_, i) => 
        (i + 1) * 0.05 + (task.title.charCodeAt(i % task.title.length) / 255)
      );

      console.log(`🤖 [Agent #${agentId}] Running inference on model ${modelName}...`);
      const inferenceRes = await aiService.runInference(modelName, inputData);

      console.log(`🤖 [Agent #${agentId}] Generating ZK proof for result...`);
      const proofRes = await proofService.processProof(
        agentId,
        modelName,
        inputData,
        inferenceRes.output,
        taskId
      );

      console.log(`🎉 Task #${taskId} successfully completed by agent #${agentId}!`);
      return {
        success: true,
        taskId,
        agentId,
        inference: inferenceRes,
        proof: proofRes
      };
    } catch (error) {
      console.error(`❌ Error processing task #${taskId} by agent #${agentId}:`, error.message);
      throw error;
    }
  }

  /**
   * Start polling for assigned tasks
   */
  startPolling() {
    if (this.isPolling) return;

    this.isPolling = true;
    console.log("📡 Starting task polling loop (every 10 seconds)...");
    
    this.pollingInterval = setInterval(async () => {
      await this.monitorTasks();
    }, 10000); // 10s polling interval
  }

  /**
   * Stop polling
   */
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      this.isPolling = false;
      console.log("📡 Stopped task polling loop");
    }
  }

  /**
   * Check all open tasks and process them if assigned to running agents
   */
  async monitorTasks() {
    if (this.runningAgents.size === 0) return;

    try {
      const openTasks = await blockchainService.getOpenTasks();
      
      for (const task of openTasks) {
        // Task state check: status = 1 (ASSIGNED), and assignedAgentId is one of running agents
        // 1 represents Assigned status in Solidity TaskStatus enum
        if (task.status === 1 && this.runningAgents.has(Number(task.assignedAgentId))) {
          console.log(`🔍 Found assigned task #${task.id} for running agent #${task.assignedAgentId}`);
          // Process asynchronously to avoid blocking the main loop
          this.processTask(task.id, task.assignedAgentId).catch(err => {
            console.error(`Failed to process task #${task.id}:`, err.message);
          });
        }
      }
    } catch (error) {
      console.error("❌ Error in task monitoring loop:", error.message);
    }
  }
}

module.exports = new AgentOrchestrator();
