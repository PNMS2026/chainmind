"""
ChainMind AI Engine — FastAPI Server
Provides inference, proof generation, and model management endpoints
"""
import os
import time
import hashlib
import json
import secrets
from typing import Dict, List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(
    title="ChainMind AI Engine",
    description="AI inference and ZK proof generation for ChainMind agents",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ──────────────────── Models ────────────────────

class InferenceRequest(BaseModel):
    model_name: str
    input_data: List[float]

class InferenceResponse(BaseModel):
    output: List[float]
    confidence: float
    latency_ms: float
    model_name: str

class ProofGenerateRequest(BaseModel):
    model_name: str
    input_data: List[float]
    output_data: List[float]

class ProofGenerateResponse(BaseModel):
    proof: str
    public_inputs: List[str]
    verification_key: str
    generation_time_ms: float

class ProofVerifyRequest(BaseModel):
    proof: str
    public_inputs: Optional[List[str]] = None

class ProofVerifyResponse(BaseModel):
    verified: bool
    message: str

class ModelInfo(BaseModel):
    name: str
    type: str
    input_dim: int
    output_dim: int
    architecture: str
    parameters: int


# ──────────────────── Mock Inference Engine ────────────────────

class MockInferenceEngine:
    """Mock inference engine for MVP — produces plausible outputs without real ONNX models"""

    MODELS = {
        "sentiment_model": {
            "type": "sentiment",
            "input_dim": 10,
            "output_dim": 1,
            "architecture": "MLP(128 → 64 → 1)",
            "parameters": 9345,
        },
        "price_predictor": {
            "type": "price_prediction",
            "input_dim": 20,
            "output_dim": 1,
            "architecture": "MLP(64 → 32 → 16 → 1)",
            "parameters": 2737,
        },
        "risk_scorer": {
            "type": "risk_assessment",
            "input_dim": 8,
            "output_dim": 1,
            "architecture": "MLP(32 → 16 → 1)",
            "parameters": 817,
        },
    }

    def predict(self, model_name: str, input_data: List[float]) -> Dict:
        if model_name not in self.MODELS:
            raise ValueError(f"Unknown model: {model_name}")

        start = time.time()
        model = self.MODELS[model_name]

        # Generate plausible output based on model type
        import random
        if model["type"] == "sentiment":
            # Sentiment score between 0 and 1
            output = [max(0.0, min(1.0, sum(input_data[:model["input_dim"]]) / model["input_dim"] * 0.5 + random.gauss(0.5, 0.15)))]
        elif model["type"] == "price_prediction":
            # Price change percentage (-10% to +10%)
            output = [sum(input_data[:5]) / 50.0 + random.gauss(0, 0.02)]
        else:
            # Risk score between 0 and 1
            output = [max(0.0, min(1.0, sum(input_data[:model["input_dim"]]) / model["input_dim"] * 0.3 + random.gauss(0.4, 0.1)))]

        latency = (time.time() - start) * 1000

        return {
            "output": output,
            "confidence": round(0.80 + random.random() * 0.19, 4),
            "latency_ms": round(latency + random.random() * 5, 2),
        }


engine = MockInferenceEngine()


# ──────────────────── Endpoints ────────────────────

@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "chainmind-ai-engine",
        "version": "1.0.0",
        "models_loaded": len(MockInferenceEngine.MODELS),
    }


@app.get("/models")
async def list_models():
    models = []
    for name, info in MockInferenceEngine.MODELS.items():
        models.append(ModelInfo(
            name=name,
            type=info["type"],
            input_dim=info["input_dim"],
            output_dim=info["output_dim"],
            architecture=info["architecture"],
            parameters=info["parameters"],
        ))
    return {"models": models}


@app.post("/inference", response_model=InferenceResponse)
async def run_inference(request: InferenceRequest):
    try:
        result = engine.predict(request.model_name, request.input_data)
        return InferenceResponse(
            output=result["output"],
            confidence=result["confidence"],
            latency_ms=result["latency_ms"],
            model_name=request.model_name,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference failed: {str(e)}")


@app.post("/proof/generate", response_model=ProofGenerateResponse)
async def generate_proof(request: ProofGenerateRequest):
    """Generate a mock ZK proof for the given inference I/O"""
    start = time.time()

    # Simulate proof generation delay
    time.sleep(0.1)  # 100ms simulated proving time

    # Generate deterministic-looking proof from inputs
    proof_seed = json.dumps({
        "model": request.model_name,
        "input": request.input_data,
        "output": request.output_data,
        "nonce": secrets.token_hex(16),
    })
    proof_hash = hashlib.sha256(proof_seed.encode()).hexdigest()
    vk_hash = hashlib.sha256(request.model_name.encode()).hexdigest()

    generation_time = (time.time() - start) * 1000

    return ProofGenerateResponse(
        proof="0x" + proof_hash + secrets.token_hex(32),
        public_inputs=[
            "0x" + hashlib.sha256(json.dumps(request.input_data).encode()).hexdigest(),
            "0x" + hashlib.sha256(json.dumps(request.output_data).encode()).hexdigest(),
        ],
        verification_key="0x" + vk_hash,
        generation_time_ms=round(generation_time, 2),
    )


@app.post("/proof/verify", response_model=ProofVerifyResponse)
async def verify_proof(request: ProofVerifyRequest):
    """Verify a proof locally (MVP: always returns true for valid-looking proofs)"""
    if not request.proof or len(request.proof) < 10:
        return ProofVerifyResponse(verified=False, message="Invalid proof format")

    return ProofVerifyResponse(
        verified=True,
        message="Proof verified successfully (mock verification)",
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
