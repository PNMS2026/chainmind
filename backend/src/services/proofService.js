const aiService = require("./aiService");
const blockchainService = require("./blockchainService");

/**
 * ProofService — Orchestrates proof lifecycle: generate -> verify locally -> submit/verify on-chain
 */
class ProofService {
  /**
   * Process a proof: request from AI engine, verify locally, and submit/verify on-chain
   * @param {string|number} agentId - The agent ID
   * @param {string} modelName - The AI model name
   * @param {Array<number>} inputData - Inference input parameters
   * @param {Array<number>} outputData - Inference output parameters
   * @param {string|number|null} taskId - Optional task ID if verifying for a marketplace task
   */
  async processProof(agentId, modelName, inputData, outputData, taskId = null) {
    console.log(`🛡️  Processing proof for agent #${agentId}, model: ${modelName}, task: ${taskId || "None"}`);

    // 1. Generate ZK Proof via AI Engine
    const proofRes = await aiService.generateProof(modelName, inputData, outputData);
    
    // 2. Verify ZK Proof locally via AI Engine
    const localVerify = await aiService.verifyProof({
      proof: proofRes.proof,
      public_inputs: proofRes.public_inputs,
      verification_key: proofRes.verification_key,
    });

    if (!localVerify.verified) {
      throw new Error(`Proof local verification failed: ${localVerify.message}`);
    }

    // 3. Submit or Verify On-chain
    let txHash = null;
    if (taskId) {
      // If there is an associated task, submit the output hash and proof to the TaskMarketplace
      const resultHash = proofRes.public_inputs[1] || "0x" + "0".repeat(64);
      const submitRes = await blockchainService.submitResult(taskId, resultHash, proofRes.proof);
      txHash = submitRes.txHash;
      console.log(`✅ Result and proof submitted for task #${taskId}. Tx: ${txHash}`);
    } else {
      // Just record/verify the proof on-chain in the ProofVerifier contract
      const inputHash = proofRes.public_inputs[0] || "0x" + "0".repeat(64);
      const outputHash = proofRes.public_inputs[1] || "0x" + "0".repeat(64);
      const verifyRes = await blockchainService.verifyProofOnChain(agentId, proofRes.proof, inputHash, outputHash);
      txHash = verifyRes.txHash;
      console.log(`✅ Proof verified on-chain. Tx: ${txHash}`);
    }

    return {
      proof: proofRes.proof,
      publicInputs: proofRes.public_inputs,
      verificationKey: proofRes.verification_key,
      generationTimeMs: proofRes.generation_time_ms,
      verifiedLocally: true,
      txHash,
    };
  }
}

module.exports = new ProofService();
