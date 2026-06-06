const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  // ──────────────────── 1. Deploy CMToken ────────────────────
  console.log("\n📦 Deploying CMToken...");
  const CMToken = await hre.ethers.getContractFactory("CMToken");
  const cmToken = await CMToken.deploy();
  await cmToken.waitForDeployment();
  const cmTokenAddress = await cmToken.getAddress();
  console.log("✅ CMToken deployed to:", cmTokenAddress);

  // ──────────────────── 2. Deploy ChainMindRegistry ────────────────────
  console.log("\n📦 Deploying ChainMindRegistry...");
  const ChainMindRegistry = await hre.ethers.getContractFactory("ChainMindRegistry");
  const registry = await ChainMindRegistry.deploy(cmTokenAddress);
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("✅ ChainMindRegistry deployed to:", registryAddress);

  // ──────────────────── 3. Deploy ProofVerifier ────────────────────
  console.log("\n📦 Deploying ProofVerifier...");
  const ProofVerifier = await hre.ethers.getContractFactory("ProofVerifier");
  const proofVerifier = await ProofVerifier.deploy();
  await proofVerifier.waitForDeployment();
  const proofVerifierAddress = await proofVerifier.getAddress();
  console.log("✅ ProofVerifier deployed to:", proofVerifierAddress);

  // ──────────────────── 4. Deploy TaskMarketplace ────────────────────
  console.log("\n📦 Deploying TaskMarketplace...");
  const TaskMarketplace = await hre.ethers.getContractFactory("TaskMarketplace");
  const taskMarketplace = await TaskMarketplace.deploy(
    cmTokenAddress,
    registryAddress,
    proofVerifierAddress
  );
  await taskMarketplace.waitForDeployment();
  const taskMarketplaceAddress = await taskMarketplace.getAddress();
  console.log("✅ TaskMarketplace deployed to:", taskMarketplaceAddress);

  // ──────────────────── 5. Deploy ReputationEngine ────────────────────
  console.log("\n📦 Deploying ReputationEngine...");
  const ReputationEngine = await hre.ethers.getContractFactory("ReputationEngine");
  const reputationEngine = await ReputationEngine.deploy();
  await reputationEngine.waitForDeployment();
  const reputationEngineAddress = await reputationEngine.getAddress();
  console.log("✅ ReputationEngine deployed to:", reputationEngineAddress);

  // ──────────────────── 6. Deploy AgentWallet (template) ────────────────────
  console.log("\n📦 Deploying AgentWallet...");
  const AgentWallet = await hre.ethers.getContractFactory("AgentWallet");
  const agentWallet = await AgentWallet.deploy();
  await agentWallet.waitForDeployment();
  const agentWalletAddress = await agentWallet.getAddress();
  console.log("✅ AgentWallet deployed to:", agentWalletAddress);

  // ──────────────────── Wire up authorizations ────────────────────
  console.log("\n🔗 Setting up cross-contract authorizations...");

  // Registry: authorize TaskMarketplace
  await registry.setAuthorizedContract(taskMarketplaceAddress, true);
  console.log("  → TaskMarketplace authorized in Registry");

  // ProofVerifier: authorize TaskMarketplace
  await proofVerifier.setAuthorizedContract(taskMarketplaceAddress, true);
  console.log("  → TaskMarketplace authorized in ProofVerifier");

  // ReputationEngine: authorize TaskMarketplace and Registry
  await reputationEngine.setAuthorizedContract(taskMarketplaceAddress, true);
  await reputationEngine.setAuthorizedContract(registryAddress, true);
  console.log("  → TaskMarketplace & Registry authorized in ReputationEngine");

  // ──────────────────── Save deployment addresses ────────────────────
  const deploymentData = {
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      CMToken: cmTokenAddress,
      ChainMindRegistry: registryAddress,
      ProofVerifier: proofVerifierAddress,
      TaskMarketplace: taskMarketplaceAddress,
      ReputationEngine: reputationEngineAddress,
      AgentWallet: agentWalletAddress,
    },
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const filePath = path.join(deploymentsDir, `${hre.network.name}.json`);
  fs.writeFileSync(filePath, JSON.stringify(deploymentData, null, 2));
  console.log(`\n💾 Deployment data saved to: ${filePath}`);

  // ──────────────────── Summary ────────────────────
  console.log("\n" + "═".repeat(60));
  console.log("🎉 ChainMind Deployment Complete!");
  console.log("═".repeat(60));
  console.log(`  CMToken:           ${cmTokenAddress}`);
  console.log(`  Registry:          ${registryAddress}`);
  console.log(`  ProofVerifier:     ${proofVerifierAddress}`);
  console.log(`  TaskMarketplace:   ${taskMarketplaceAddress}`);
  console.log(`  ReputationEngine:  ${reputationEngineAddress}`);
  console.log(`  AgentWallet:       ${agentWalletAddress}`);
  console.log("═".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
