const { ethers } = require("ethers");
const config = require("../config/env");
const { loadABI, loadDeployment, getContractAddress } = require("../config/contracts");

/**
 * BlockchainService — Manages all smart contract interactions via ethers.js
 */
class BlockchainService {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(config.ethereumRpcUrl);
    this.signer = config.privateKey
      ? new ethers.Wallet(config.privateKey, this.provider)
      : null;
    this.contracts = {};
    this.initialized = false;
  }

  async initialize() {
    const deployment = loadDeployment("localhost");
    if (!deployment) {
      console.warn("⚠️  No deployment data — blockchain service running in mock mode");
      this.initialized = false;
      return;
    }

    const contractNames = [
      "CMToken",
      "ChainMindRegistry",
      "ProofVerifier",
      "TaskMarketplace",
      "ReputationEngine",
      "AgentWallet",
    ];

    for (const name of contractNames) {
      const abi = loadABI(name);
      const address = getContractAddress(name);
      if (abi && address) {
        this.contracts[name] = new ethers.Contract(address, abi, this.signer || this.provider);
        console.log(`  ✅ ${name} loaded at ${address}`);
      }
    }

    this.initialized = true;
    console.log("🔗 BlockchainService initialized");
    
    // Seed dev data on startup if empty
    await this.seedData();
  }

  async seedData() {
    if (!this.initialized || !this.signer) return;
    try {
      const registry = this.contracts.ChainMindRegistry;
      const totalAgents = await registry.getTotalAgents();
      if (Number(totalAgents) === 0) {
        console.log("🌱 Blockchain is empty. Seeding initial development data...");

        const CMToken = this.contracts.CMToken;
        const registryAddress = await registry.getAddress();
        
        // Track nonce manually to prevent race conditions in automining
        let nonce = await this.signer.getNonce();

        // Approve registry for staking all 4 agents
        const totalStake = ethers.parseEther("10000"); // 1000 CMT per agent, approve 10k
        console.log("  Approving CMT stake...");
        const approveTx = await CMToken.approve(registryAddress, totalStake, { nonce: nonce++ });
        await approveTx.wait();

        const agentsToSeed = [
          { name: "SentinelAI", modelHash: "QmSentimentModelONNXHash", circuitHash: "QmSentimentZKCircuitHash", type: 0 },
          { name: "AlphaTrader", modelHash: "QmPriceModelONNXHash", circuitHash: "QmPriceZKCircuitHash", type: 1 },
          { name: "RiskGuard", modelHash: "QmRiskModelONNXHash", circuitHash: "QmRiskZKCircuitHash", type: 2 },
          { name: "OracleX", modelHash: "QmOracleModelONNXHash", circuitHash: "QmOracleZKCircuitHash", type: 3 }
        ];

        for (const a of agentsToSeed) {
          console.log(`  Registering agent ${a.name}...`);
          const tx = await registry.registerAgent(a.name, a.modelHash, a.circuitHash, a.type, { nonce: nonce++ });
          const receipt = await tx.wait();
          
          // Get registered agent ID
          const event = receipt.logs.find((log) => {
            try {
              return registry.interface.parseLog(log)?.name === "AgentRegistered";
            } catch { return false; }
          });
          const parsedEvent = registry.interface.parseLog(event);
          const agentId = parsedEvent.args.agentId;

          // Set status to ACTIVE (1)
          const updateTx = await registry.updateAgentStatus(agentId, 1, { nonce: nonce++ });
          await updateTx.wait();
          console.log(`  Agent #${agentId} status set to ACTIVE`);
        }

        // Seeding marketplace tasks
        const marketplace = this.contracts.TaskMarketplace;
        
        // Approve marketplace for task rewards
        const approveMarketTx = await CMToken.approve(await marketplace.getAddress(), totalStake, { nonce: nonce++ });
        await approveMarketTx.wait();

        const tasksToSeed = [
          { title: "Analyze BTC Sentiment", description: "Audit BTC sentiment index from Twitter data streams", type: 0, reward: "500", deadlineDays: 2 },
          { title: "Predict ETH Price", description: "Inference next 4-hour pricing path for ETH/USD pair", type: 1, reward: "1200", deadlineDays: 3 },
          { title: "Risk Assessment Portfolio A", description: "Audit DeFi lending exposure on select pools", type: 2, reward: "800", deadlineDays: 1 }
        ];

        for (const t of tasksToSeed) {
          console.log(`  Creating marketplace task: ${t.title}...`);
          const deadline = Math.floor(Date.now() / 1000) + (t.deadlineDays * 86400);
          const tx = await marketplace.createTask(
            t.title,
            t.description,
            "QmInput" + Math.floor(Math.random() * 1000),
            t.type,
            ethers.parseEther(t.reward),
            deadline,
            { nonce: nonce++ }
          );
          await tx.wait();
        }

        console.log("🌱 Dev seeding completed successfully!");
      } else {
        console.log(`📡 Dev seeding skipped: ${totalAgents} agents already registered on-chain.`);
      }
    } catch (error) {
      console.error("❌ Seeding dev data failed:", error.message);
    }
  }

  // ──────────────────── Agent Operations ────────────────────

  async registerAgent(name, modelHash, circuitHash, agentType, stakeAmount) {
    if (!this.initialized) return this._mockAgent(name, agentType);

    const registry = this.contracts.ChainMindRegistry;
    const token = this.contracts.CMToken;

    // Approve stake
    const approveTx = await token.approve(await registry.getAddress(), stakeAmount);
    await approveTx.wait();

    // Register
    const tx = await registry.registerAgent(name, modelHash, circuitHash, agentType);
    const receipt = await tx.wait();

    const event = receipt.logs.find((log) => {
      try {
        return registry.interface.parseLog(log)?.name === "AgentRegistered";
      } catch { return false; }
    });

    const parsedEvent = registry.interface.parseLog(event);
    return { agentId: parsedEvent.args.agentId.toString(), txHash: receipt.hash };
  }

  async getAgent(agentId) {
    if (!this.initialized) return this._mockAgent(`Agent #${agentId}`, 0);
    const agent = await this.contracts.ChainMindRegistry.getAgent(agentId);
    return this._formatAgent(agent);
  }

  async getTopAgents(limit = 10) {
    if (!this.initialized) return this._mockAgents(limit);
    const agents = await this.contracts.ChainMindRegistry.getTopAgents(limit);
    return agents.map(this._formatAgent);
  }

  async getTotalAgents() {
    if (!this.initialized) return 12; // Mock
    return Number(await this.contracts.ChainMindRegistry.getTotalAgents());
  }

  // ──────────────────── Task Operations ────────────────────

  async createTask(title, description, inputHash, taskType, reward, deadline) {
    if (!this.initialized) return { taskId: Date.now().toString(), txHash: "0x_mock" };

    const marketplace = this.contracts.TaskMarketplace;
    const token = this.contracts.CMToken;

    await (await token.approve(await marketplace.getAddress(), reward)).wait();

    const tx = await marketplace.createTask(title, description, inputHash, taskType, reward, deadline);
    const receipt = await tx.wait();
    return { taskId: "1", txHash: receipt.hash };
  }

  async getTask(taskId) {
    if (!this.initialized) return this._mockTask(taskId);
    const task = await this.contracts.TaskMarketplace.getTask(taskId);
    return this._formatTask(task);
  }

  async getOpenTasks() {
    if (!this.initialized) return this._mockTasks(5);
    const tasks = await this.contracts.TaskMarketplace.getOpenTasks();
    return tasks.map(this._formatTask);
  }

  async assignTask(taskId, agentId) {
    if (!this.initialized) return { txHash: "0x_mock" };
    const tx = await this.contracts.TaskMarketplace.assignTask(taskId, agentId);
    const receipt = await tx.wait();
    return { txHash: receipt.hash };
  }

  async submitResult(taskId, resultHash, proof) {
    if (!this.initialized) return { txHash: "0x_mock", verified: true };
    const tx = await this.contracts.TaskMarketplace.submitResult(taskId, resultHash, proof);
    const receipt = await tx.wait();
    return { txHash: receipt.hash, verified: true };
  }

  // ──────────────────── Proof Operations ────────────────────

  async verifyProofOnChain(agentId, proof, inputHash, outputHash) {
    if (!this.initialized) return { verified: true, txHash: "0x_mock" };
    const tx = await this.contracts.ProofVerifier.verifyProof(agentId, proof, inputHash, outputHash);
    const receipt = await tx.wait();
    return { verified: true, txHash: receipt.hash };
  }

  async getProofRecord(proofHash) {
    if (!this.initialized) return this._mockProof(proofHash);
    return await this.contracts.ProofVerifier.getProofRecord(proofHash);
  }

  async getTotalProofsVerified() {
    if (!this.initialized) return 847; // Mock
    return Number(await this.contracts.ProofVerifier.getTotalProofsVerified());
  }

  // ──────────────────── Analytics ────────────────────

  async getDashboardStats() {
    return {
      totalAgents: await this.getTotalAgents(),
      totalProofs: await this.getTotalProofsVerified(),
      activeTasks: 8,
      totalEarnings: "125,430",
    };
  }

  // ──────────────────── Formatting Helpers ────────────────────

  _formatAgent(agent) {
    return {
      id: Number(agent.id),
      owner: agent.owner,
      name: agent.name,
      modelHash: agent.modelHash,
      circuitHash: agent.circuitHash,
      agentType: Number(agent.agentType),
      status: Number(agent.status),
      stakedAmount: ethers.formatEther(agent.stakedAmount),
      reputationScore: Number(agent.reputationScore),
      tasksCompleted: Number(agent.tasksCompleted),
      totalEarned: ethers.formatEther(agent.totalEarned),
      createdAt: Number(agent.createdAt),
    };
  }

  _formatTask(task) {
    return {
      id: Number(task.id),
      creator: task.creator,
      title: task.title,
      description: task.description,
      inputDataHash: task.inputDataHash,
      taskType: Number(task.taskType),
      reward: ethers.formatEther(task.reward),
      deadline: Number(task.deadline),
      assignedAgentId: Number(task.assignedAgentId),
      status: Number(task.status),
      resultHash: task.resultHash,
      proofHash: task.proofHash,
      createdAt: Number(task.createdAt),
    };
  }

  // ──────────────────── Mock Data ────────────────────

  _mockAgent(name, type) {
    return {
      id: Math.floor(Math.random() * 100),
      owner: "0x" + "a".repeat(40),
      name: name,
      modelHash: "QmMockModelHash" + Math.random().toString(36).substr(2, 8),
      circuitHash: "QmMockCircuitHash" + Math.random().toString(36).substr(2, 8),
      agentType: type,
      status: 1,
      stakedAmount: "1000.0",
      reputationScore: 7500,
      tasksCompleted: 42,
      totalEarned: "8250.0",
      createdAt: Math.floor(Date.now() / 1000),
    };
  }

  _mockAgents(count) {
    const names = ["AlphaTrader", "SentinelAI", "RiskGuard", "OracleX", "DeepAnalyst",
                    "QuantumTrader", "NeuralScout", "ProofMaster", "DataSage", "CryptoOwl"];
    const types = [0, 1, 2, 3, 4];
    return Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      owner: "0x" + (i + 1).toString(16).padStart(40, "0"),
      name: names[i % names.length],
      modelHash: "QmModel" + i,
      circuitHash: "QmCircuit" + i,
      agentType: types[i % types.length],
      status: i < 8 ? 1 : 0,
      stakedAmount: (1000 + i * 500).toString(),
      reputationScore: 5000 + Math.floor(Math.random() * 5000),
      tasksCompleted: Math.floor(Math.random() * 100),
      totalEarned: (Math.random() * 50000).toFixed(2),
      createdAt: Math.floor(Date.now() / 1000) - i * 86400,
    }));
  }

  _mockTask(id) {
    const titles = ["Analyze BTC Sentiment", "Predict ETH Price", "Risk Assessment Portfolio A",
                     "Market Trend Analysis", "DeFi Protocol Audit"];
    return {
      id: Number(id),
      creator: "0x" + "b".repeat(40),
      title: titles[id % titles.length],
      description: "Mock task description",
      inputDataHash: "QmInput" + id,
      taskType: id % 4,
      reward: "500.0",
      deadline: Math.floor(Date.now() / 1000) + 86400,
      assignedAgentId: 0,
      status: 0,
      resultHash: "",
      proofHash: "0x" + "0".repeat(64),
      createdAt: Math.floor(Date.now() / 1000),
    };
  }

  _mockTasks(count) {
    return Array.from({ length: count }, (_, i) => this._mockTask(i + 1));
  }

  _mockProof(hash) {
    return {
      taskId: 1,
      agentId: 1,
      proofHash: hash,
      inputHash: "0x" + "c".repeat(64),
      outputHash: "0x" + "d".repeat(64),
      verified: true,
      verifiedAt: Math.floor(Date.now() / 1000),
      gasUsed: 245000,
    };
  }
}

module.exports = new BlockchainService();
