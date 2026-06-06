const path = require("path");
const fs = require("fs");
let contractsData = null;
try {
  contractsData = require("./contractsData").CONTRACTS;
} catch (e) {
  console.warn("⚠️  contractsData.js not generated yet, using empty mock object");
  contractsData = {};
}

let deploymentData = null;

function loadDeployment(networkName = "localhost") {
  const deploymentsPath = path.join(
    __dirname,
    "..",
    "..",
    "..",
    "contracts",
    "deployments",
    `${networkName}.json`
  );

  if (fs.existsSync(deploymentsPath)) {
    deploymentData = JSON.parse(fs.readFileSync(deploymentsPath, "utf8"));
    console.log(`📋 Loaded deployment data for ${networkName}`);
    return deploymentData;
  }

  // Fallback to contractsData addresses
  const fallbackContracts = {};
  for (const [name, contract] of Object.entries(contractsData)) {
    fallbackContracts[name] = contract.address;
  }
  deploymentData = { contracts: fallbackContracts };
  console.warn(`⚠️  No deployment file found. Using contractsData fallbacks.`);
  return deploymentData;
}

function getContractAddress(contractName) {
  if (!deploymentData) {
    loadDeployment();
  }
  return deploymentData?.contracts?.[contractName] || contractsData[contractName]?.address || null;
}

function loadABI(contractName) {
  const artifactPath = path.join(
    __dirname,
    "..",
    "..",
    "..",
    "contracts",
    "artifacts",
    "src",
    `${contractName}.sol`,
    `${contractName}.json`
  );

  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    return artifact.abi;
  }

  // Fallback to contractsData ABI
  if (contractsData[contractName]) {
    return contractsData[contractName].abi;
  }

  console.warn(`⚠️  No ABI found for ${contractName}`);
  return null;
}

module.exports = {
  loadDeployment,
  getContractAddress,
  loadABI,
};
