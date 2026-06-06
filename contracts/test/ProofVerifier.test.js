const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ProofVerifier", function () {
  let proofVerifier;
  let owner, authorized, unauthorized;

  beforeEach(async function () {
    [owner, authorized, unauthorized] = await ethers.getSigners();

    const ProofVerifier = await ethers.getContractFactory("ProofVerifier");
    proofVerifier = await ProofVerifier.deploy();
    await proofVerifier.waitForDeployment();

    // Authorize a contract
    await proofVerifier.setAuthorizedContract(authorized.address, true);
  });

  describe("Verification Key Registration", function () {
    it("should register a verification key", async function () {
      const vkData = ethers.toUtf8Bytes("mock_verification_key_data");
      await proofVerifier.registerVerificationKey(1, vkData);

      expect(await proofVerifier.hasVerificationKey(1)).to.be.true;
    });

    it("should prevent unauthorized registration", async function () {
      const vkData = ethers.toUtf8Bytes("mock_vk");
      await expect(
        proofVerifier.connect(unauthorized).registerVerificationKey(1, vkData)
      ).to.be.revertedWith("Not authorized");
    });
  });

  describe("Proof Verification", function () {
    beforeEach(async function () {
      const vkData = ethers.toUtf8Bytes("mock_verification_key");
      await proofVerifier.registerVerificationKey(1, vkData);
    });

    it("should verify a valid proof", async function () {
      const proof = ethers.toUtf8Bytes("mock_proof_data");
      const inputHash = ethers.keccak256(ethers.toUtf8Bytes("input"));
      const outputHash = ethers.keccak256(ethers.toUtf8Bytes("output"));

      const tx = await proofVerifier.connect(authorized).verifyProof(
        1, proof, inputHash, outputHash
      );
      const receipt = await tx.wait();
      expect(receipt.status).to.equal(1);

      expect(await proofVerifier.getTotalProofsVerified()).to.equal(1);
    });

    it("should emit ProofVerified event", async function () {
      const proof = ethers.toUtf8Bytes("mock_proof");
      const inputHash = ethers.keccak256(ethers.toUtf8Bytes("input"));
      const outputHash = ethers.keccak256(ethers.toUtf8Bytes("output"));

      await expect(
        proofVerifier.connect(authorized).verifyProof(1, proof, inputHash, outputHash)
      ).to.emit(proofVerifier, "ProofVerified");
    });

    it("should reject empty proof", async function () {
      const inputHash = ethers.keccak256(ethers.toUtf8Bytes("input"));
      const outputHash = ethers.keccak256(ethers.toUtf8Bytes("output"));

      await expect(
        proofVerifier.connect(authorized).verifyProof(1, "0x", inputHash, outputHash)
      ).to.be.revertedWith("Empty proof");
    });

    it("should reject proof for agent without VK", async function () {
      const proof = ethers.toUtf8Bytes("mock_proof");
      const inputHash = ethers.keccak256(ethers.toUtf8Bytes("input"));
      const outputHash = ethers.keccak256(ethers.toUtf8Bytes("output"));

      await expect(
        proofVerifier.connect(authorized).verifyProof(999, proof, inputHash, outputHash)
      ).to.be.revertedWith("No active verification key for agent");
    });

    it("should prevent unauthorized verification", async function () {
      const proof = ethers.toUtf8Bytes("mock_proof");
      const inputHash = ethers.keccak256(ethers.toUtf8Bytes("input"));
      const outputHash = ethers.keccak256(ethers.toUtf8Bytes("output"));

      await expect(
        proofVerifier.connect(unauthorized).verifyProof(1, proof, inputHash, outputHash)
      ).to.be.revertedWith("Not authorized");
    });
  });

  describe("Proof Records", function () {
    beforeEach(async function () {
      const vkData = ethers.toUtf8Bytes("mock_vk");
      await proofVerifier.registerVerificationKey(1, vkData);
    });

    it("should return proofs by agent", async function () {
      const proof1 = ethers.toUtf8Bytes("proof_1");
      const proof2 = ethers.toUtf8Bytes("proof_2");
      const inputHash = ethers.keccak256(ethers.toUtf8Bytes("input"));
      const outputHash = ethers.keccak256(ethers.toUtf8Bytes("output"));

      await proofVerifier.connect(authorized).verifyProof(1, proof1, inputHash, outputHash);
      await proofVerifier.connect(authorized).verifyProof(1, proof2, inputHash, outputHash);

      const records = await proofVerifier.getProofsByAgent(1);
      expect(records.length).to.equal(2);
    });

    it("should track total proofs verified", async function () {
      const proof = ethers.toUtf8Bytes("proof");
      const inputHash = ethers.keccak256(ethers.toUtf8Bytes("input"));
      const outputHash = ethers.keccak256(ethers.toUtf8Bytes("output"));

      await proofVerifier.connect(authorized).verifyProof(1, proof, inputHash, outputHash);
      expect(await proofVerifier.getTotalProofsVerified()).to.equal(1);
    });
  });
});
