# Deployment Guide

This guide describes how to deploy the ChainMind Protocol workspace in both local development environments and multi-container production orchestrations.

---

## 🐋 Production Deployment (Docker Compose)

The multi-container configuration launches the frontend, backend, and proving engine concurrently.

### 1. Prerequisites
- Docker (v20.10+)
- Docker Compose (v2.0+)

### 2. Configure Environment Variables
Create a production `.env` configuration file in `chainmind/backend/.env` containing your RPC endpoints and secure keys:
```env
PORT=3001
NODE_ENV=production
ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/your_key
PRIVATE_KEY=your_deployer_key
AI_ENGINE_URL=http://ai-engine:8000
```

### 3. Spin Up Containers
From the `chainmind` root folder:
```bash
docker-compose up -d --build
```
This commands builds the front-end package, launches Express, and loads the FastAPI inference engine. The frontend serves page assets on port `3000`.
