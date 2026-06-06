// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title AgentWallet
 * @dev Smart contract wallet for autonomous AI agents
 * @notice Each agent gets a wallet with spending limits and owner overrides
 */
contract AgentWallet is Ownable, ReentrancyGuard {
    // ──────────────────── Structs ────────────────────
    struct SpendingLimit {
        uint256 dailyLimit;
        uint256 spentToday;
        uint256 lastResetTimestamp;
    }

    // ──────────────────── State ────────────────────
    uint256 public agentId;
    address public agentOwner;
    bool public initialized;

    SpendingLimit public spendingLimit;

    // Authorized orchestrator addresses that can execute actions
    mapping(address => bool) public authorizedOrchestrators;

    // Action log
    struct ActionLog {
        address target;
        uint256 value;
        bytes data;
        uint256 timestamp;
        bool success;
    }
    ActionLog[] public actionHistory;

    // ──────────────────── Events ────────────────────
    event WalletInitialized(uint256 indexed agentId, address indexed owner);
    event ActionExecuted(address indexed target, uint256 value, bool success);
    event SpendingLimitUpdated(uint256 dailyLimit);
    event EmergencyWithdrawal(address indexed owner, uint256 amount);
    event OrchestratorUpdated(address indexed orchestrator, bool authorized);

    // ──────────────────── Modifiers ────────────────────
    modifier onlyAgentOwner() {
        require(msg.sender == agentOwner, "Not agent owner");
        _;
    }

    modifier onlyOrchestrator() {
        require(authorizedOrchestrators[msg.sender] || msg.sender == agentOwner, "Not authorized");
        _;
    }

    modifier isInitialized() {
        require(initialized, "Wallet not initialized");
        _;
    }

    // ──────────────────── Constructor ────────────────────
    constructor() Ownable(msg.sender) {}

    // ──────────────────── External Functions ────────────────────

    /**
     * @dev Initialize the wallet for an agent
     * @param _agentId ID of the agent this wallet belongs to
     * @param _agentOwner Owner of the agent
     */
    function initialize(uint256 _agentId, address _agentOwner) external onlyOwner {
        require(!initialized, "Already initialized");
        require(_agentOwner != address(0), "Invalid owner");

        agentId = _agentId;
        agentOwner = _agentOwner;
        initialized = true;

        spendingLimit = SpendingLimit({
            dailyLimit: 1 ether,       // Default: 1 ETH per day
            spentToday: 0,
            lastResetTimestamp: block.timestamp
        });

        emit WalletInitialized(_agentId, _agentOwner);
    }

    /**
     * @dev Execute an action from the agent's wallet
     * @param target Target contract/address
     * @param value ETH value to send
     * @param data Calldata for the target
     * @param proof ZK proof that this action is rational (checked if value above threshold)
     * @return result The return data from the call
     */
    function executeAction(
        address target,
        uint256 value,
        bytes calldata data,
        bytes calldata proof
    ) external isInitialized onlyOrchestrator nonReentrant returns (bytes memory result) {
        // Reset daily spending if new day
        if (block.timestamp - spendingLimit.lastResetTimestamp >= 1 days) {
            spendingLimit.spentToday = 0;
            spendingLimit.lastResetTimestamp = block.timestamp;
        }

        // Check spending limits
        require(
            spendingLimit.spentToday + value <= spendingLimit.dailyLimit,
            "Daily spending limit exceeded"
        );

        // For MVP, we don't verify the proof — just check it's non-empty for large transactions
        if (value > 0.1 ether) {
            require(proof.length > 0, "Proof required for large transactions");
        }

        // Execute the action
        bool success;
        (success, result) = target.call{value: value}(data);

        if (success) {
            spendingLimit.spentToday += value;
        }

        // Log the action
        actionHistory.push(ActionLog({
            target: target,
            value: value,
            data: data,
            timestamp: block.timestamp,
            success: success
        }));

        emit ActionExecuted(target, value, success);
    }

    /**
     * @dev Set the daily spending limit
     * @param dailyLimit New daily limit in wei
     */
    function setSpendingLimit(uint256 dailyLimit) external onlyAgentOwner {
        spendingLimit.dailyLimit = dailyLimit;
        emit SpendingLimitUpdated(dailyLimit);
    }

    /**
     * @dev Emergency withdrawal of all funds to the agent owner
     */
    function emergencyWithdraw() external onlyAgentOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");

        (bool success, ) = agentOwner.call{value: balance}("");
        require(success, "Withdrawal failed");

        emit EmergencyWithdrawal(agentOwner, balance);
    }

    /**
     * @dev Set an authorized orchestrator
     * @param orchestrator Address of the orchestrator
     * @param authorized Whether to authorize or revoke
     */
    function setOrchestrator(address orchestrator, bool authorized) external onlyAgentOwner {
        authorizedOrchestrators[orchestrator] = authorized;
        emit OrchestratorUpdated(orchestrator, authorized);
    }

    // ──────────────────── View Functions ────────────────────

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getActionCount() external view returns (uint256) {
        return actionHistory.length;
    }

    function getRemainingDailyBudget() external view returns (uint256) {
        if (block.timestamp - spendingLimit.lastResetTimestamp >= 1 days) {
            return spendingLimit.dailyLimit;
        }
        if (spendingLimit.spentToday >= spendingLimit.dailyLimit) return 0;
        return spendingLimit.dailyLimit - spendingLimit.spentToday;
    }

    // Allow receiving ETH
    receive() external payable {}
    fallback() external payable {}
}
