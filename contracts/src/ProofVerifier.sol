// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ProofVerifier
 * @dev Verifies ZK proofs of AI model inference on-chain
 * @notice MVP uses simplified verification; real Groth16 verifier in v2
 */
contract ProofVerifier is Ownable {
    // ──────────────────── Structs ────────────────────
    struct VerificationKey {
        uint256 agentId;
        bytes vkData;            // Serialized verification key
        bool isActive;
        uint256 registeredAt;
    }

    struct ProofRecord {
        uint256 taskId;
        uint256 agentId;
        bytes32 proofHash;
        bytes32 inputHash;
        bytes32 outputHash;
        bool verified;
        uint256 verifiedAt;
        uint256 gasUsed;
    }

    // ──────────────────── State ────────────────────
    mapping(uint256 => VerificationKey) public verificationKeys; // agentId => VK
    mapping(bytes32 => ProofRecord) public proofRecords;        // proofHash => record
    mapping(uint256 => bytes32[]) public agentProofs;           // agentId => proofHashes

    uint256 public totalProofsVerified;

    // Authorized contracts (TaskMarketplace)
    mapping(address => bool) public authorizedContracts;

    // ──────────────────── Events ────────────────────
    event VerificationKeyRegistered(uint256 indexed agentId, uint256 timestamp);
    event ProofVerified(
        uint256 indexed agentId,
        uint256 indexed taskId,
        bytes32 inputHash,
        bytes32 outputHash,
        uint256 gasUsed,
        bool verified
    );

    // ──────────────────── Modifiers ────────────────────
    modifier onlyAuthorized() {
        require(authorizedContracts[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }

    // ──────────────────── Constructor ────────────────────
    constructor() Ownable(msg.sender) {}

    // ──────────────────── External Functions ────────────────────

    /**
     * @dev Register a verification key for an agent
     * @param agentId ID of the agent
     * @param vkData Serialized verification key bytes
     */
    function registerVerificationKey(
        uint256 agentId,
        bytes calldata vkData
    ) external onlyAuthorized {
        verificationKeys[agentId] = VerificationKey({
            agentId: agentId,
            vkData: vkData,
            isActive: true,
            registeredAt: block.timestamp
        });

        emit VerificationKeyRegistered(agentId, block.timestamp);
    }

    /**
     * @dev Verify a ZK proof of AI inference
     * @notice MVP: Simplified verification using hash checks. Real Groth16 in v2.
     * @param agentId ID of the agent that generated the proof
     * @param proof The proof bytes
     * @param inputHash Hash of the input data
     * @param outputHash Hash of the output data
     * @return verified Whether the proof is valid
     */
    function verifyProof(
        uint256 agentId,
        bytes calldata proof,
        bytes32 inputHash,
        bytes32 outputHash
    ) external onlyAuthorized returns (bool verified) {
        uint256 gasStart = gasleft();

        // MVP verification: check that VK exists and proof is non-empty
        // Real implementation would use Groth16/KZG pairing checks
        VerificationKey storage vk = verificationKeys[agentId];
        require(vk.isActive, "No active verification key for agent");
        require(proof.length > 0, "Empty proof");

        // Generate proof hash from proof bytes
        bytes32 proofHash = keccak256(abi.encodePacked(proof, inputHash, outputHash, block.timestamp));

        // MVP: Simplified verification — accept all well-formed proofs
        // In production, this would run the actual ZK verification circuit
        verified = true;

        uint256 gasUsed = gasStart - gasleft();

        // Record the proof
        proofRecords[proofHash] = ProofRecord({
            taskId: 0, // Will be set by caller context
            agentId: agentId,
            proofHash: proofHash,
            inputHash: inputHash,
            outputHash: outputHash,
            verified: verified,
            verifiedAt: block.timestamp,
            gasUsed: gasUsed
        });

        agentProofs[agentId].push(proofHash);

        if (verified) {
            totalProofsVerified++;
        }

        emit ProofVerified(agentId, 0, inputHash, outputHash, gasUsed, verified);
    }

    /**
     * @dev Verify proof and record with a specific task ID
     */
    function verifyProofForTask(
        uint256 agentId,
        uint256 taskId,
        bytes calldata proof,
        bytes32 inputHash,
        bytes32 outputHash
    ) external onlyAuthorized returns (bool verified) {
        uint256 gasStart = gasleft();

        VerificationKey storage vk = verificationKeys[agentId];
        require(vk.isActive, "No active verification key for agent");
        require(proof.length > 0, "Empty proof");

        bytes32 proofHash = keccak256(abi.encodePacked(proof, inputHash, outputHash, block.timestamp));

        verified = true;

        uint256 gasUsed = gasStart - gasleft();

        proofRecords[proofHash] = ProofRecord({
            taskId: taskId,
            agentId: agentId,
            proofHash: proofHash,
            inputHash: inputHash,
            outputHash: outputHash,
            verified: verified,
            verifiedAt: block.timestamp,
            gasUsed: gasUsed
        });

        agentProofs[agentId].push(proofHash);

        if (verified) {
            totalProofsVerified++;
        }

        emit ProofVerified(agentId, taskId, inputHash, outputHash, gasUsed, verified);
    }

    // ──────────────────── Admin ────────────────────

    function setAuthorizedContract(address contractAddress, bool authorized) external onlyOwner {
        authorizedContracts[contractAddress] = authorized;
    }

    function deactivateVerificationKey(uint256 agentId) external onlyOwner {
        verificationKeys[agentId].isActive = false;
    }

    // ──────────────────── View Functions ────────────────────

    function getProofRecord(bytes32 proofHash) external view returns (ProofRecord memory) {
        return proofRecords[proofHash];
    }

    function getProofsByAgent(uint256 agentId) external view returns (ProofRecord[] memory) {
        bytes32[] memory hashes = agentProofs[agentId];
        ProofRecord[] memory records = new ProofRecord[](hashes.length);
        for (uint256 i = 0; i < hashes.length; i++) {
            records[i] = proofRecords[hashes[i]];
        }
        return records;
    }

    function getTotalProofsVerified() external view returns (uint256) {
        return totalProofsVerified;
    }

    function hasVerificationKey(uint256 agentId) external view returns (bool) {
        return verificationKeys[agentId].isActive;
    }
}
