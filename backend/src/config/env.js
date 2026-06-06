require("dotenv").config();

const config = {
  port: parseInt(process.env.PORT || "3001", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  ethereumRpcUrl: process.env.ETHEREUM_RPC_URL || "http://127.0.0.1:8545",
  privateKey: process.env.PRIVATE_KEY || "",
  pinataApiKey: process.env.PINATA_API_KEY || "",
  pinataSecret: process.env.PINATA_SECRET || "",
  aiEngineUrl: process.env.AI_ENGINE_URL || "http://localhost:8000",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
};

module.exports = config;
