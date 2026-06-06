// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ReputationEngine
 * @dev Soulbound (non-transferable) reputation system for AI agents
 * @notice Reputation increases with successful tasks, decreases with failures
 */
contract ReputationEngine is Ownable {
    // ──────────────────── Structs ────────────────────
    struct ReputationEvent {
        uint256 agentId;
        int256 change;           // Positive or negative change
        string reason;
        uint256 timestamp;
        uint256 newScore;
    }

    // ──────────────────── State ────────────────────
    mapping(uint256 => uint256) public reputations;           // agentId => score (0-10000)
    mapping(uint256 => ReputationEvent[]) public reputationHistory; // agentId => events

    // Authorized contracts (TaskMarketplace, ProofVerifier)
    mapping(address => bool) public authorizedContracts;

    // ──────────────────── Events ────────────────────
    event ReputationUpdated(uint256 indexed agentId, int256 change, string reason, uint256 newScore);

    // ──────────────────── Modifiers ────────────────────
    modifier onlyAuthorized() {
        require(authorizedContracts[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }

    // ──────────────────── Constructor ────────────────────
    constructor() Ownable(msg.sender) {}

    // ──────────────────── External Functions ────────────────────

    /**
     * @dev Initialize reputation for a new agent
     * @param agentId ID of the agent
     * @param initialScore Initial reputation score
     */
    function initializeReputation(uint256 agentId, uint256 initialScore) external onlyAuthorized {
        require(initialScore <= 10000, "Score must be <= 10000");
        reputations[agentId] = initialScore;

        reputationHistory[agentId].push(ReputationEvent({
            agentId: agentId,
            change: int256(initialScore),
            reason: "Initial registration",
            timestamp: block.timestamp,
            newScore: initialScore
        }));

        emit ReputationUpdated(agentId, int256(initialScore), "Initial registration", initialScore);
    }

    /**
     * @dev Update reputation with a positive or negative change
     * @param agentId ID of the agent
     * @param change Positive or negative reputation change
     * @param reason Description of why reputation changed
     */
    function updateReputation(
        uint256 agentId,
        int256 change,
        string memory reason
    ) external onlyAuthorized {
        uint256 currentScore = reputations[agentId];
        uint256 newScore;

        if (change >= 0) {
            newScore = currentScore + uint256(change);
            if (newScore > 10000) newScore = 10000;
        } else {
            uint256 decrease = uint256(-change);
            newScore = currentScore > decrease ? currentScore - decrease : 0;
        }

        reputations[agentId] = newScore;

        reputationHistory[agentId].push(ReputationEvent({
            agentId: agentId,
            change: change,
            reason: reason,
            timestamp: block.timestamp,
            newScore: newScore
        }));

        emit ReputationUpdated(agentId, change, reason, newScore);
    }

    // ──────────────────── Admin ────────────────────

    function setAuthorizedContract(address contractAddress, bool authorized) external onlyOwner {
        authorizedContracts[contractAddress] = authorized;
    }

    // ──────────────────── View Functions ────────────────────

    function getReputation(uint256 agentId) external view returns (uint256) {
        return reputations[agentId];
    }

    function getReputationHistory(uint256 agentId) external view returns (ReputationEvent[] memory) {
        return reputationHistory[agentId];
    }

    function getLeaderboard(uint256 limit, uint256 totalAgents) external view returns (uint256[] memory, uint256[] memory) {
        // Returns parallel arrays of (agentIds, scores) sorted by score descending
        uint256 count = limit > totalAgents ? totalAgents : limit;

        uint256[] memory ids = new uint256[](count);
        uint256[] memory scores = new uint256[](count);

        // Collect all agents with scores
        uint256[] memory allIds = new uint256[](totalAgents);
        uint256[] memory allScores = new uint256[](totalAgents);

        for (uint256 i = 0; i < totalAgents; i++) {
            allIds[i] = i + 1;
            allScores[i] = reputations[i + 1];
        }

        // Simple selection sort for top N
        for (uint256 i = 0; i < count; i++) {
            uint256 maxIdx = i;
            for (uint256 j = i + 1; j < totalAgents; j++) {
                if (allScores[j] > allScores[maxIdx]) {
                    maxIdx = j;
                }
            }
            // Swap
            if (maxIdx != i) {
                (allIds[i], allIds[maxIdx]) = (allIds[maxIdx], allIds[i]);
                (allScores[i], allScores[maxIdx]) = (allScores[maxIdx], allScores[i]);
            }
            ids[i] = allIds[i];
            scores[i] = allScores[i];
        }

        return (ids, scores);
    }
}
