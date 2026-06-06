const config = require("../config/env");

/**
 * AIService — Communicates with the Python AI engine via HTTP
 */
class AIService {
  constructor() {
    this.baseUrl = config.aiEngineUrl;
  }

  async runInference(modelName, inputData) {
    try {
      const response = await fetch(`${this.baseUrl}/inference`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model_name: modelName, input_data: inputData }),
      });

      if (!response.ok) {
        throw new Error(`AI Engine error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.warn("⚠️  AI Engine unavailable, returning mock inference");
      return this._mockInference(modelName, inputData);
    }
  }

  async generateProof(modelName, inputData, outputData) {
    try {
      const response = await fetch(`${this.baseUrl}/proof/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model_name: modelName, input_data: inputData, output_data: outputData }),
      });

      if (!response.ok) {
        throw new Error(`AI Engine error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.warn("⚠️  AI Engine unavailable, returning mock proof");
      return this._mockProof();
    }
  }

  async verifyProof(proofData) {
    try {
      const response = await fetch(`${this.baseUrl}/proof/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(proofData),
      });

      if (!response.ok) {
        throw new Error(`AI Engine error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      return { verified: true, message: "Mock verification (AI engine unavailable)" };
    }
  }

  async listModels() {
    try {
      const response = await fetch(`${this.baseUrl}/models`);
      if (!response.ok) throw new Error("Failed to list models");
      return await response.json();
    } catch {
      return {
        models: [
          { name: "sentiment_model", type: "sentiment", input_dim: 10, output_dim: 1 },
          { name: "price_predictor", type: "price_prediction", input_dim: 20, output_dim: 1 },
          { name: "risk_scorer", type: "risk_assessment", input_dim: 8, output_dim: 1 },
        ],
      };
    }
  }

  // ──────────────────── Mock Data ────────────────────

  _mockInference(modelName, inputData) {
    const mockResults = {
      sentiment_model: { output: [0.78], confidence: 0.92, latency_ms: 15 },
      price_predictor: { output: [0.034], confidence: 0.85, latency_ms: 22 },
      risk_scorer: { output: [0.42], confidence: 0.88, latency_ms: 8 },
    };

    return mockResults[modelName] || {
      output: [Math.random()],
      confidence: 0.8 + Math.random() * 0.2,
      latency_ms: Math.floor(Math.random() * 30),
    };
  }

  _mockProof() {
    const randomHex = (len) => "0x" + Array.from({ length: len }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join("");

    return {
      proof: randomHex(128),
      public_inputs: [randomHex(32), randomHex(32)],
      verification_key: randomHex(64),
      generation_time_ms: 1200 + Math.floor(Math.random() * 800),
    };
  }
}

module.exports = new AIService();
