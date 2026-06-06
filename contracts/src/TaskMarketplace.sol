// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IChainMindRegistry {
    enum AgentStatus { IDLE, ACTIVE, PAUSED, RETIRED }
    struct Agent {
        uint256 id;
        address owner;
        string name;
        string modelHash;
        string circuitHash;
        uint8 agentType;
        AgentStatus status;
        uint256 stakedAmount;
        uint256 reputationScore;
        uint256 tasksCompleted;
        uint256 totalEarned;
        uint256 createdAt;
    }
    function getAgent(uint256 agentId) external view returns (Agent memory);
    function recordTaskCompletion(uint256 agentId, uint256 earned) external;
    function slashAgent(uint256 agentId, uint256 amount) external;
    function updateReputation(uint256 agentId, uint256 newScore) external;
}

interface IProofVerifier {
    function verifyProofForTask(
        uint256 agentId,
        uint256 taskId,
        bytes calldata proof,
        bytes32 inputHash,
        bytes32 outputHash
    ) external returns (bool);
}

/**
 * @title TaskMarketplace
 * @dev Marketplace for creating, assigning, and completing AI tasks
 * @notice Tasks are funded with CMT tokens; rewards released upon proof verification
 */
contract TaskMarketplace is Ownable, ReentrancyGuard {
    // ──────────────────── Enums ────────────────────
    enum TaskType { SENTIMENT, PRICE_PREDICTION, RISK_ASSESSMENT, CUSTOM }
    enum TaskStatus { OPEN, ASSIGNED, COMPLETED, VERIFIED, DISPUTED, EXPIRED }

    // ──────────────────── Structs ────────────────────
    struct Task {
        uint256 id;
        address creator;
        string title;
        string description;
        string inputDataHash;     // IPFS hash of input data
        TaskType taskType;
        uint256 reward;           // CMT reward amount
        uint256 deadline;         // Block timestamp deadline
        uint256 assignedAgentId;  // 0 if unassigned
        TaskStatus status;
        string resultHash;        // IPFS hash of result
        bytes32 proofHash;        // Hash of ZK proof
        uint256 createdAt;
    }

    // ──────────────────── State ────────────────────
    IERC20 public cmToken;
    IChainMindRegistry public registry;
    IProofVerifier public proofVerifier;

    uint256 public nextTaskId = 1;
    mapping(uint256 => Task) public tasks;
    mapping(uint256 => uint256[]) public agentTasks; // agentId => taskIds

    uint256 public totalTasksCreated;
    uint256 public totalTasksCompleted;
    uint256 public totalRewardsDistributed;

    // ──────────────────── Events ────────────────────
    event TaskCreated(uint256 indexed taskId, address indexed creator, TaskType taskType, uint256 reward);
    event TaskAssigned(uint256 indexed taskId, uint256 indexed agentId);
    event TaskCompleted(uint256 indexed taskId, uint256 indexed agentId, string resultHash, bool verified);
    event TaskDisputed(uint256 indexed taskId, address indexed disputer);
    event RewardClaimed(uint256 indexed taskId, uint256 indexed agentId, uint256 amount);

    // ──────────────────── Modifiers ────────────────────
    modifier taskExists(uint256 taskId) {
        require(tasks[taskId].creator != address(0), "Task does not exist");
        _;
    }

    // ──────────────────── Constructor ────────────────────
    constructor(
        address _cmToken,
        address _registry,
        address _proofVerifier
    ) Ownable(msg.sender) {
        cmToken = IERC20(_cmToken);
        registry = IChainMindRegistry(_registry);
        proofVerifier = IProofVerifier(_proofVerifier);
    }

    // ──────────────────── External Functions ────────────────────

    /**
     * @dev Create a new task with CMT reward deposit
     * @param title Task title
     * @param description Task description
     * @param inputDataHash IPFS hash of input data
     * @param taskType Type of task
     * @param reward Reward amount in CMT
     * @param deadline Task deadline timestamp
     * @return taskId The ID of the created task
     */
    function createTask(
        string memory title,
        string memory description,
        string memory inputDataHash,
        TaskType taskType,
        uint256 reward,
        uint256 deadline
    ) external nonReentrant returns (uint256 taskId) {
        require(bytes(title).length > 0, "Title cannot be empty");
        require(reward > 0, "Reward must be > 0");
        require(deadline > block.timestamp, "Deadline must be in future");

        // Transfer reward from creator to this contract
        require(cmToken.transferFrom(msg.sender, address(this), reward), "Reward transfer failed");

        taskId = nextTaskId++;

        tasks[taskId] = Task({
            id: taskId,
            creator: msg.sender,
            title: title,
            description: description,
            inputDataHash: inputDataHash,
            taskType: taskType,
            reward: reward,
            deadline: deadline,
            assignedAgentId: 0,
            status: TaskStatus.OPEN,
            resultHash: "",
            proofHash: bytes32(0),
            createdAt: block.timestamp
        });

        totalTasksCreated++;

        emit TaskCreated(taskId, msg.sender, taskType, reward);
    }

    /**
     * @dev Assign an agent to a task
     * @param taskId ID of the task
     * @param agentId ID of the agent to assign
     */
    function assignTask(uint256 taskId, uint256 agentId)
        external
        taskExists(taskId)
        nonReentrant
    {
        Task storage task = tasks[taskId];
        require(task.status == TaskStatus.OPEN, "Task not open");
        require(block.timestamp < task.deadline, "Task expired");

        // Verify the agent exists, is active, and caller is agent owner
        IChainMindRegistry.Agent memory agent = registry.getAgent(agentId);
        require(agent.owner == msg.sender, "Not agent owner");
        require(agent.status == IChainMindRegistry.AgentStatus.ACTIVE, "Agent not active");

        task.assignedAgentId = agentId;
        task.status = TaskStatus.ASSIGNED;

        agentTasks[agentId].push(taskId);

        emit TaskAssigned(taskId, agentId);
    }

    /**
     * @dev Submit task result with ZK proof
     * @param taskId ID of the task
     * @param resultHash IPFS hash of the result
     * @param proof ZK proof bytes
     */
    function submitResult(
        uint256 taskId,
        string memory resultHash,
        bytes calldata proof
    ) external taskExists(taskId) nonReentrant {
        Task storage task = tasks[taskId];
        require(task.status == TaskStatus.ASSIGNED, "Task not assigned");

        // Verify caller is the assigned agent's owner
        IChainMindRegistry.Agent memory agent = registry.getAgent(task.assignedAgentId);
        require(agent.owner == msg.sender, "Not assigned agent owner");

        // Generate hashes for verification
        bytes32 inputHash = keccak256(abi.encodePacked(task.inputDataHash));
        bytes32 outputHash = keccak256(abi.encodePacked(resultHash));

        // Verify proof on-chain
        bool verified = proofVerifier.verifyProofForTask(
            task.assignedAgentId,
            taskId,
            proof,
            inputHash,
            outputHash
        );

        task.resultHash = resultHash;
        task.proofHash = keccak256(proof);

        if (verified) {
            task.status = TaskStatus.VERIFIED;

            // Release reward to agent owner
            require(cmToken.transfer(agent.owner, task.reward), "Reward transfer failed");

            // Update agent stats
            registry.recordTaskCompletion(task.assignedAgentId, task.reward);

            // Increase reputation
            uint256 newRep = agent.reputationScore + 100;
            if (newRep > 10000) newRep = 10000;
            registry.updateReputation(task.assignedAgentId, newRep);

            totalTasksCompleted++;
            totalRewardsDistributed += task.reward;
        } else {
            task.status = TaskStatus.DISPUTED;

            // Slash agent for invalid proof
            registry.slashAgent(task.assignedAgentId, 100 * 10**18); // Slash 100 CMT

            // Decrease reputation
            uint256 newRep = agent.reputationScore > 500 ? agent.reputationScore - 500 : 0;
            registry.updateReputation(task.assignedAgentId, newRep);
        }

        emit TaskCompleted(taskId, task.assignedAgentId, resultHash, verified);
    }

    /**
     * @dev Dispute a task result
     * @param taskId ID of the task to dispute
     */
    function disputeResult(uint256 taskId)
        external
        taskExists(taskId)
    {
        Task storage task = tasks[taskId];
        require(task.creator == msg.sender, "Only creator can dispute");
        require(
            task.status == TaskStatus.COMPLETED || task.status == TaskStatus.VERIFIED,
            "Cannot dispute this task"
        );

        task.status = TaskStatus.DISPUTED;
        emit TaskDisputed(taskId, msg.sender);
    }

    /**
     * @dev Reclaim reward from an expired task
     * @param taskId ID of the expired task
     */
    function reclaimExpiredTask(uint256 taskId)
        external
        taskExists(taskId)
        nonReentrant
    {
        Task storage task = tasks[taskId];
        require(task.creator == msg.sender, "Only creator can reclaim");
        require(block.timestamp >= task.deadline, "Task not expired");
        require(
            task.status == TaskStatus.OPEN || task.status == TaskStatus.ASSIGNED,
            "Task already completed"
        );

        task.status = TaskStatus.EXPIRED;
        require(cmToken.transfer(msg.sender, task.reward), "Refund failed");
    }

    // ──────────────────── View Functions ────────────────────

    function getTask(uint256 taskId) external view returns (Task memory) {
        require(tasks[taskId].creator != address(0), "Task does not exist");
        return tasks[taskId];
    }

    function getOpenTasks() external view returns (Task[] memory) {
        // Count open tasks
        uint256 count = 0;
        for (uint256 i = 1; i < nextTaskId; i++) {
            if (tasks[i].status == TaskStatus.OPEN) count++;
        }

        Task[] memory openTasks = new Task[](count);
        uint256 index = 0;
        for (uint256 i = 1; i < nextTaskId; i++) {
            if (tasks[i].status == TaskStatus.OPEN) {
                openTasks[index++] = tasks[i];
            }
        }
        return openTasks;
    }

    function getTasksByAgent(uint256 agentId) external view returns (uint256[] memory) {
        return agentTasks[agentId];
    }

    function getTaskCount() external view returns (uint256) {
        return nextTaskId - 1;
    }
}
