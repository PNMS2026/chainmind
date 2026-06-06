// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ChainMindRegistry
 * @dev Core registry where AI agents are registered and managed on-chain
 * @notice Manages agent registration, staking, status updates, and slashing
 */
contract ChainMindRegistry is Ownable, ReentrancyGuard {
    // ──────────────────── Enums ────────────────────
    enum AgentType { TRADER, ANALYST, AUDITOR, ORACLE, CUSTOM }
    enum AgentStatus { IDLE, ACTIVE, PAUSED, RETIRED }

    // ──────────────────── Structs ────────────────────
    struct Agent {
        uint256 id;
        address owner;
        string name;
        string modelHash;        // IPFS hash of the ONNX model
        string circuitHash;      // IPFS hash of the ZK circuit
        AgentType agentType;
        AgentStatus status;
        uint256 stakedAmount;    // CMT staked as collateral
        uint256 reputationScore; // 0-10000 (basis points)
        uint256 tasksCompleted;
        uint256 totalEarned;
        uint256 createdAt;
    }

    // ──────────────────── State ────────────────────
    IERC20 public cmToken;
    uint256 public nextAgentId = 1;
    uint256 public minimumStake = 1000 * 10**18; // 1000 CMT

    mapping(uint256 => Agent) public agents;
    mapping(address => uint256[]) public ownerAgents;

    // Authorized contracts that can modify agent data
    mapping(address => bool) public authorizedContracts;

    // ──────────────────── Events ────────────────────
    event AgentRegistered(uint256 indexed agentId, address indexed owner, string name, AgentType agentType);
    event AgentStatusUpdated(uint256 indexed agentId, AgentStatus status);
    event AgentSlashed(uint256 indexed agentId, uint256 amount);
    event AgentStaked(uint256 indexed agentId, uint256 amount);
    event ReputationUpdated(uint256 indexed agentId, uint256 newScore);

    // ──────────────────── Modifiers ────────────────────
    modifier onlyAgentOwner(uint256 agentId) {
        require(agents[agentId].owner == msg.sender, "Not agent owner");
        _;
    }

    modifier onlyAuthorized() {
        require(authorizedContracts[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }

    modifier agentExists(uint256 agentId) {
        require(agents[agentId].owner != address(0), "Agent does not exist");
        _;
    }

    // ──────────────────── Constructor ────────────────────
    constructor(address _cmToken) Ownable(msg.sender) {
        cmToken = IERC20(_cmToken);
    }

    // ──────────────────── External Functions ────────────────────

    /**
     * @dev Register a new AI agent. Requires minimum stake of CMT tokens.
     * @param name Agent display name
     * @param modelHash IPFS hash of the ONNX model
     * @param circuitHash IPFS hash of the ZK circuit
     * @param agentType Type of agent (TRADER, ANALYST, etc.)
     * @return agentId The ID of the newly registered agent
     */
    function registerAgent(
        string memory name,
        string memory modelHash,
        string memory circuitHash,
        AgentType agentType
    ) external nonReentrant returns (uint256 agentId) {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(modelHash).length > 0, "Model hash cannot be empty");

        // Transfer minimum stake from caller
        require(cmToken.transferFrom(msg.sender, address(this), minimumStake), "Stake transfer failed");

        agentId = nextAgentId++;

        agents[agentId] = Agent({
            id: agentId,
            owner: msg.sender,
            name: name,
            modelHash: modelHash,
            circuitHash: circuitHash,
            agentType: agentType,
            status: AgentStatus.IDLE,
            stakedAmount: minimumStake,
            reputationScore: 5000, // Start at 50% (basis points)
            tasksCompleted: 0,
            totalEarned: 0,
            createdAt: block.timestamp
        });

        ownerAgents[msg.sender].push(agentId);

        emit AgentRegistered(agentId, msg.sender, name, agentType);
    }

    /**
     * @dev Update the status of an agent
     * @param agentId ID of the agent
     * @param status New status
     */
    function updateAgentStatus(uint256 agentId, AgentStatus status)
        external
        agentExists(agentId)
        onlyAgentOwner(agentId)
    {
        require(agents[agentId].status != AgentStatus.RETIRED || status == AgentStatus.RETIRED,
            "Cannot change retired agent status");
        agents[agentId].status = status;
        emit AgentStatusUpdated(agentId, status);
    }

    /**
     * @dev Add additional stake to an agent
     * @param agentId ID of the agent
     * @param amount Amount of CMT to stake
     */
    function stakeForAgent(uint256 agentId, uint256 amount)
        external
        agentExists(agentId)
        nonReentrant
    {
        require(amount > 0, "Amount must be > 0");
        require(cmToken.transferFrom(msg.sender, address(this), amount), "Stake transfer failed");

        agents[agentId].stakedAmount += amount;
        emit AgentStaked(agentId, amount);
    }

    /**
     * @dev Slash an agent's staked tokens (called by ProofVerifier on invalid proof)
     * @param agentId ID of the agent
     * @param amount Amount to slash
     */
    function slashAgent(uint256 agentId, uint256 amount)
        external
        agentExists(agentId)
        onlyAuthorized
    {
        Agent storage agent = agents[agentId];
        uint256 slashAmount = amount > agent.stakedAmount ? agent.stakedAmount : amount;
        agent.stakedAmount -= slashAmount;

        // Transfer slashed tokens to contract owner (treasury)
        require(cmToken.transfer(owner(), slashAmount), "Slash transfer failed");

        emit AgentSlashed(agentId, slashAmount);
    }

    /**
     * @dev Update agent reputation (called by authorized contracts)
     * @param agentId ID of the agent
     * @param newScore New reputation score (0-10000)
     */
    function updateReputation(uint256 agentId, uint256 newScore)
        external
        agentExists(agentId)
        onlyAuthorized
    {
        require(newScore <= 10000, "Score must be <= 10000");
        agents[agentId].reputationScore = newScore;
        emit ReputationUpdated(agentId, newScore);
    }

    /**
     * @dev Increment tasks completed and total earned (called by TaskMarketplace)
     * @param agentId ID of the agent
     * @param earned Amount earned from task
     */
    function recordTaskCompletion(uint256 agentId, uint256 earned)
        external
        agentExists(agentId)
        onlyAuthorized
    {
        agents[agentId].tasksCompleted += 1;
        agents[agentId].totalEarned += earned;
    }

    // ──────────────────── Admin Functions ────────────────────

    /**
     * @dev Set an authorized contract address
     * @param contractAddress Address to authorize
     * @param authorized Whether to authorize or revoke
     */
    function setAuthorizedContract(address contractAddress, bool authorized) external onlyOwner {
        authorizedContracts[contractAddress] = authorized;
    }

    /**
     * @dev Update the minimum stake requirement
     * @param newMinimum New minimum stake amount
     */
    function setMinimumStake(uint256 newMinimum) external onlyOwner {
        minimumStake = newMinimum;
    }

    // ──────────────────── View Functions ────────────────────

    function getAgent(uint256 agentId) external view returns (Agent memory) {
        require(agents[agentId].owner != address(0), "Agent does not exist");
        return agents[agentId];
    }

    function getAgentsByOwner(address ownerAddr) external view returns (uint256[] memory) {
        return ownerAgents[ownerAddr];
    }

    function getTopAgents(uint256 limit) external view returns (Agent[] memory) {
        uint256 total = nextAgentId - 1;
        uint256 count = limit > total ? total : limit;

        Agent[] memory topAgents = new Agent[](count);

        // Simple approach: return the most recent agents
        // In production, would sort by reputation
        for (uint256 i = 0; i < count; i++) {
            topAgents[i] = agents[total - i];
        }
        return topAgents;
    }

    function getTotalAgents() external view returns (uint256) {
        return nextAgentId - 1;
    }
}
