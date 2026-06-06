const fs = require("fs");
const path = require("path");

function copyArtifacts() {
  const contractsDir = path.join(__dirname, "contracts");
  const frontendDir = path.join(__dirname, "frontend");
  const backendDir = path.join(__dirname, "backend");

  const contractNames = [
    "CMToken",
    "ChainMindRegistry",
    "ProofVerifier",
    "TaskMarketplace",
    "ReputationEngine",
    "AgentWallet"
  ];

  const abis = {};

  for (const name of contractNames) {
    const artifactPath = path.join(
      contractsDir,
      "artifacts",
      "src",
      `${name}.sol`,
      `${name}.json`
    );

    if (fs.existsSync(artifactPath)) {
      const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
      abis[name] = artifact.abi;
      console.log(`✅ Loaded ABI for ${name}`);
    } else {
      console.warn(`⚠️  Missing artifact for ${name} at ${artifactPath}`);
    }
  }

  // Load deployment addresses if exist, otherwise use mock/default
  let deployment = {
    contracts: {
      CMToken: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
      ChainMindRegistry: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
      ProofVerifier: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
      TaskMarketplace: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
      ReputationEngine: "0xDc64a17db3422267802911412aF7920E7c69518a",
      AgentWallet: "0x0165878A594ca255338adfa4d48449f69242Eb8F"
    }
  };

  const deploymentPath = path.join(contractsDir, "deployments", "localhost.json");
  if (fs.existsSync(deploymentPath)) {
    deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    console.log("✅ Loaded localhost deployment addresses");
  } else {
    console.log("⚠️  Using default/mock deployment addresses");
  }

  // Generate frontend contractsData.js
  const frontendDataContent = `// Generated automatically by copy-artifacts.js
export const CONTRACTS = {
${contractNames.map(name => `  ${name}: {
    address: "${deployment.contracts[name] || ''}",
    abi: ${JSON.stringify(abis[name] || [], null, 2)}
  }`).join(",\n")}
};
`;

  const frontendLibDir = path.join(frontendDir, "lib");
  if (!fs.existsSync(frontendLibDir)) {
    fs.mkdirSync(frontendLibDir, { recursive: true });
  }
  fs.writeFileSync(path.join(frontendLibDir, "contractsData.js"), frontendDataContent);
  console.log("💾 Wrote frontend/lib/contractsData.js");

  // Generate backend contractsData.js
  const backendDataContent = `// Generated automatically by copy-artifacts.js
const CONTRACTS = {
${contractNames.map(name => `  ${name}: {
    address: "${deployment.contracts[name] || ''}",
    abi: ${JSON.stringify(abis[name] || [], null, 2)}
  }`).join(",\n")}
};

module.exports = { CONTRACTS };
`;

  const backendConfigDir = path.join(backendDir, "src", "config");
  if (!fs.existsSync(backendConfigDir)) {
    fs.mkdirSync(backendConfigDir, { recursive: true });
  }
  fs.writeFileSync(path.join(backendConfigDir, "contractsData.js"), backendDataContent);
  console.log("💾 Wrote backend/src/config/contractsData.js");
}

copyArtifacts();
