const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ChainMindRegistry", function () {
  let cmToken, registry;
  let owner, user1, user2;
  const MINIMUM_STAKE = ethers.parseEther("1000");

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy CMToken
    const CMToken = await ethers.getContractFactory("CMToken");
    cmToken = await CMToken.deploy();
    await cmToken.waitForDeployment();

    // Deploy Registry
    const Registry = await ethers.getContractFactory("ChainMindRegistry");
    registry = await Registry.deploy(await cmToken.getAddress());
    await registry.waitForDeployment();

    // Transfer tokens to user1 for testing
    await cmToken.transfer(user1.address, ethers.parseEther("10000"));
    // Approve registry to spend user1's tokens
    await cmToken.connect(user1).approve(await registry.getAddress(), ethers.parseEther("10000"));
  });

  describe("Agent Registration", function () {
    it("should register a new agent with minimum stake", async function () {
      const tx = await registry.connect(user1).registerAgent(
        "AlphaTrader",
        "QmModelHash123",
        "QmCircuitHash456",
        0 // TRADER
      );

      const receipt = await tx.wait();
      expect(receipt.status).to.equal(1);

      const agent = await registry.getAgent(1);
      expect(agent.name).to.equal("AlphaTrader");
      expect(agent.owner).to.equal(user1.address);
      expect(agent.stakedAmount).to.equal(MINIMUM_STAKE);
      expect(agent.reputationScore).to.equal(5000);
      expect(agent.status).to.equal(0); // IDLE
    });

    it("should emit AgentRegistered event", async function () {
      await expect(
        registry.connect(user1).registerAgent("AlphaTrader", "QmModel", "QmCircuit", 0)
      ).to.emit(registry, "AgentRegistered")
        .withArgs(1, user1.address, "AlphaTrader", 0);
    });

    it("should fail with empty name", async function () {
      await expect(
        registry.connect(user1).registerAgent("", "QmModel", "QmCircuit", 0)
      ).to.be.revertedWith("Name cannot be empty");
    });

    it("should fail without sufficient token approval", async function () {
      await cmToken.connect(user1).approve(await registry.getAddress(), 0);
      await expect(
        registry.connect(user1).registerAgent("Test", "QmModel", "QmCircuit", 0)
      ).to.be.reverted;
    });

    it("should increment agent IDs", async function () {
      await registry.connect(user1).registerAgent("Agent1", "QmModel1", "QmCircuit1", 0);
      await registry.connect(user1).registerAgent("Agent2", "QmModel2", "QmCircuit2", 1);

      expect(await registry.getTotalAgents()).to.equal(2);

      const agent1 = await registry.getAgent(1);
      const agent2 = await registry.getAgent(2);
      expect(agent1.name).to.equal("Agent1");
      expect(agent2.name).to.equal("Agent2");
    });
  });

  describe("Status Updates", function () {
    beforeEach(async function () {
      await registry.connect(user1).registerAgent("TestAgent", "QmModel", "QmCircuit", 0);
    });

    it("should allow owner to update status", async function () {
      await registry.connect(user1).updateAgentStatus(1, 1); // ACTIVE
      const agent = await registry.getAgent(1);
      expect(agent.status).to.equal(1); // ACTIVE
    });

    it("should prevent non-owner from updating status", async function () {
      await expect(
        registry.connect(user2).updateAgentStatus(1, 1)
      ).to.be.revertedWith("Not agent owner");
    });
  });

  describe("Staking", function () {
    beforeEach(async function () {
      await registry.connect(user1).registerAgent("TestAgent", "QmModel", "QmCircuit", 0);
    });

    it("should allow additional staking", async function () {
      const additionalStake = ethers.parseEther("500");
      await registry.connect(user1).stakeForAgent(1, additionalStake);

      const agent = await registry.getAgent(1);
      expect(agent.stakedAmount).to.equal(MINIMUM_STAKE + additionalStake);
    });
  });

  describe("Slashing", function () {
    beforeEach(async function () {
      await registry.connect(user1).registerAgent("TestAgent", "QmModel", "QmCircuit", 0);
    });

    it("should allow authorized contract to slash", async function () {
      await registry.setAuthorizedContract(owner.address, true);
      const slashAmount = ethers.parseEther("100");
      await registry.slashAgent(1, slashAmount);

      const agent = await registry.getAgent(1);
      expect(agent.stakedAmount).to.equal(MINIMUM_STAKE - slashAmount);
    });

    it("should prevent unauthorized slashing", async function () {
      await expect(
        registry.connect(user2).slashAgent(1, ethers.parseEther("100"))
      ).to.be.revertedWith("Not authorized");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await registry.connect(user1).registerAgent("Agent1", "QmModel1", "QmCircuit1", 0);
      await registry.connect(user1).registerAgent("Agent2", "QmModel2", "QmCircuit2", 1);
    });

    it("should return agents by owner", async function () {
      const agentIds = await registry.getAgentsByOwner(user1.address);
      expect(agentIds.length).to.equal(2);
    });

    it("should return total agents", async function () {
      expect(await registry.getTotalAgents()).to.equal(2);
    });

    it("should return top agents", async function () {
      const topAgents = await registry.getTopAgents(5);
      expect(topAgents.length).to.equal(2);
    });
  });
});
