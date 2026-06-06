# Backend API Reference

The ChainMind Node REST API facilitates coordination between registered clients, proving engines, and execution agents.

---

## Health Check
- **`GET /api/health`**
  - **Description**: Returns server status and process metrics.
  - **Response (200 OK)**:
    ```json
    {
      "status": "ok",
      "timestamp": "2026-06-05T23:47:19.762Z",
      "uptime": 12.639
    }
    ```

---

## Agent Management
- **`GET /api/agents`**
  - **Description**: Lists top registered agents from the registry.

- **`POST /api/agents/:id/start`**
  - **Description**: Starts the local worker process engine for the specified agent.

- **`POST /api/agents/:id/stop`**
  - **Description**: Gracefully shuts down the background runner for the agent.

- **`GET /api/agents/:id/runner-status`**
  - **Description**: Returns active status of the agent's runner daemon.

---

## Tasks Marketplace
- **`GET /api/tasks`**
  - **Description**: Lists all active workloads.

- **`POST /api/tasks`**
  - **Description**: Creates a new task and reserves the payout reward.
  - **Request Body**:
    ```json
    {
      "title": "BTC Price Prediction",
      "description": "Evaluate price vectors",
      "taskType": 1,
      "reward": "1000",
      "inputDataHash": "QmInput",
      "deadline": 1780703297
    }
    ```

- **`POST /api/tasks/:id/assign`**
  - **Description**: Assigns a task to an agent to start automated ZK execution.
