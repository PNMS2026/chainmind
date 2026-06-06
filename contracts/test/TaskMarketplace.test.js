const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TaskMarketplace", function () {
  let cmToken, registry, proofVerifier, marketplace;
  let owner, creator, agentOwner;
  const MINIMUM_STAKE = ethers.parseEther("1000");
  const REWARD_AMOUNT = ethers.parseEther("500");

  beforeEach(async function () {
    [owner, creator, agentOwner] = await ethers.getSigners();

    // Deploy all contracts
    const CMToken = await ethers.getContractFactory("CMToken");
    cmToken = await CMToken.deploy();
    await cmToken.waitForDeployment();

    const Registry = await ethers.getContractFactory("ChainMindRegistry");
    registry = await Registry.deploy(await cmToken.getAddress());
    await registry.waitForDeployment();

    const ProofVerifier = await ethers.getContractFactory("ProofVerifier");
    proofVerifier = await ProofVerifier.deploy();
    await proofVerifier.waitForDeployment();

    const TaskMarketplace = await ethers.getContractFactory("TaskMarketplace");
    marketplace = await TaskMarketplace.deploy(
      await cmToken.getAddress(),
      await registry.getAddress(),
      await proofVerifier.getAddress()
    );
    await marketplace.waitForDeployment();

    // Set up authorizations
    const marketplaceAddr = await marketplace.getAddress();
    await registry.setAuthorizedContract(marketplaceAddr, true);
    await proofVerifier.setAuthorizedContract(marketplaceAddr, true);

    // Fund users with CMT
    await cmToken.transfer(creator.address, ethers.parseEther("10000"));
    await cmToken.transfer(agentOwner.address, ethers.parseEther("10000"));

    // Approve contracts
    await cmToken.connect(agentOwner).approve(await registry.getAddress(), ethers.parseEther("10000"));
    await cmToken.connect(creator).approve(marketplaceAddr, ethers.parseEther("10000"));

    // Register an agent
    await registry.connect(agentOwner).registerAgent(
      "TestAgent", "QmModel", "QmCircuit", 0
    );
    // Activate agent
    await registry.connect(agentOwner).updateAgentStatus(1, 1); // ACTIVE

    // Register verification key for agent
    await proofVerifier.registerVerificationKey(1, ethers.toUtf8Bytes("mock_vk_data"));
  });

  describe("Task Creation", function () {
    it("should create a task with reward deposit", async function () {
      const deadline = Math.floor(Date.now() / 1000) + 86400; // 24h from now
      await marketplace.connect(creator).createTask(
        "Analyze sentiment",
        "Analyze BTC tweets",
        "QmInputData",
        0, // SENTIMENT
        REWARD_AMOUNT,
        deadline
      );

      const task = await marketplace.getTask(1);
      expect(task.title).to.equal("Analyze sentiment");
      expect(task.reward).to.equal(REWARD_AMOUNT);
      expect(task.status).to.equal(0); // OPEN
    });

    it("should emit TaskCreated event", async function () {
      const deadline = Math.floor(Date.now() / 1000) + 86400;
      await expect(
        marketplace.connect(creator).createTask("Test", "Desc", "QmData", 0, REWARD_AMOUNT, deadline)
      ).to.emit(marketplace, "TaskCreated");
    });

    it("should fail with zero reward", async function () {
      const deadline = Math.floor(Date.now() / 1000) + 86400;
      await expect(
        marketplace.connect(creator).createTask("Test", "Desc", "QmData", 0, 0, deadline)
      ).to.be.revertedWith("Reward must be > 0");
    });
  });

  describe("Task Assignment", function () {
    beforeEach(async function () {
      const deadline = Math.floor(Date.now() / 1000) + 86400;
      await marketplace.connect(creator).createTask(
        "Test Task", "Description", "QmData", 0, REWARD_AMOUNT, deadline
      );
    });

    it("should assign agent to task", async function () {
      await marketplace.connect(agentOwner).assignTask(1, 1);
      const task = await marketplace.getTask(1);
      expect(task.assignedAgentId).to.equal(1);
      expect(task.status).to.equal(1); // ASSIGNED
    });

    it("should prevent non-agent-owner from assigning", async function () {
      await expect(
        marketplace.connect(creator).assignTask(1, 1)
      ).to.be.revertedWith("Not agent owner");
    });
  });

  describe("Result Submission", function () {
    beforeEach(async function () {
      const deadline = Math.floor(Date.now() / 1000) + 86400;
      await marketplace.connect(creator).createTask(
        "Test Task", "Description", "QmData", 0, REWARD_AMOUNT, deadline
      );
      await marketplace.connect(agentOwner).assignTask(1, 1);
    });

    it("should submit and verify result", async function () {
      const proof = ethers.toUtf8Bytes("mock_proof_data_for_verification");
      const balanceBefore = await cmToken.balanceOf(agentOwner.address);

      await marketplace.connect(agentOwner).submitResult(1, "QmResultHash", proof);

      const task = await marketplace.getTask(1);
      expect(task.status).to.equal(3); // VERIFIED
      expect(task.resultHash).to.equal("QmResultHash");

      // Check reward was transferred
      const balanceAfter = await cmToken.balanceOf(agentOwner.address);
      expect(balanceAfter - balanceBefore).to.equal(REWARD_AMOUNT);
    });
  });

  describe("View Functions", function () {
    it("should return open tasks", async function () {
      const deadline = Math.floor(Date.now() / 1000) + 86400;
      await marketplace.connect(creator).createTask("Task 1", "D1", "QmD1", 0, REWARD_AMOUNT, deadline);
      await marketplace.connect(creator).createTask("Task 2", "D2", "QmD2", 1, REWARD_AMOUNT, deadline);

      const openTasks = await marketplace.getOpenTasks();
      expect(openTasks.length).to.equal(2);
    });

    it("should return task count", async function () {
      const deadline = Math.floor(Date.now() / 1000) + 86400;
      await marketplace.connect(creator).createTask("Task 1", "D1", "QmD1", 0, REWARD_AMOUNT, deadline);
      expect(await marketplace.getTaskCount()).to.equal(1);
    });
  });
});
