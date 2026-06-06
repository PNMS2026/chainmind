const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const agentRoutes = require("./routes/agents");
const taskRoutes = require("./routes/tasks");
const proofRoutes = require("./routes/proofs");
const analyticsRoutes = require("./routes/analytics");

const app = express();
const PORT = process.env.PORT || 3001;

// ──────────────────── Middleware ────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: "Too many requests, please try again later." },
});
app.use("/api/", limiter);

// ──────────────────── Routes ────────────────────
app.use("/api/agents", agentRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/proofs", proofRoutes);
app.use("/api/analytics", analyticsRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ──────────────────── Error Handling ────────────────────
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

const blockchainService = require("./services/blockchainService");

// ──────────────────── Start Server ────────────────────
app.listen(PORT, async () => {
  console.log(`🚀 ChainMind Backend running on http://localhost:${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || "development"}`);
  
  try {
    await blockchainService.initialize();
  } catch (error) {
    console.error("❌ Failed to initialize blockchain service:", error.message);
  }
});

module.exports = app;
