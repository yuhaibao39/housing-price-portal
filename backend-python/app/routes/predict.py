"""
Prediction route handlers matching the Task 1 Housing Price Prediction API.

POST /predict        — single prediction
POST /predict/batch  — batch prediction
GET  /predict/history — local history (Task 2 extension)
POST /compare        — comparison (Task 2 extension)
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Request

from app.models.schemas import (
    HousingFeatures,
    PredictionRequest,
    SinglePredictionResponse,
    BatchPredictionRequest,
    BatchPredictionResponse,
)
from app.services.model_service import ModelService

logger = logging.getLogger(__name__)

router = APIRouter()

# In-memory history store
_history: list[dict] = []


def _get_model_service(request: Request) -> ModelService:
    return request.app.state.model_service


# ── Single prediction ──────────────────────────────────────────────

@router.post(
    "/predict",
    response_model=SinglePredictionResponse,
    summary="Predict housing price",
    description="Accepts a single set of housing features and returns the predicted price in USD.",
)
async def predict_single(
    body: PredictionRequest,
    model_service: ModelService = Depends(_get_model_service),
) -> SinglePredictionResponse:
    """Predict price for a single property."""
    try:
        price = model_service.predict(body.features)

        # Save to history
        _history.append({
            "id": f"{int(datetime.now(timezone.utc).timestamp())}-{len(_history)}",
            "features": body.features.model_dump(),
            "predicted_price": price,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
        if len(_history) > 10_000:
            _history[:] = _history[-5_000:]

        return SinglePredictionResponse(
            predicted_price=round(price, 2),
            input_features=body.features,
        )
    except Exception as exc:
        logger.exception("Prediction failed")
        raise HTTPException(status_code=500, detail=str(exc))


# ── Batch prediction ───────────────────────────────────────────────

@router.post(
    "/predict/batch",
    response_model=BatchPredictionResponse,
    summary="Batch predict housing prices",
    description="Accepts up to 10,000 sets of housing features and returns predictions for all of them.",
)
async def predict_batch(
    body: BatchPredictionRequest,
    model_service: ModelService = Depends(_get_model_service),
) -> BatchPredictionResponse:
    """Predict prices for multiple properties."""
    try:
        prices = model_service.predict_batch(body.features)
        return BatchPredictionResponse(
            predictions=[round(p, 2) for p in prices],
            count=len(prices),
        )
    except Exception as exc:
        logger.exception("Batch prediction failed")
        raise HTTPException(status_code=500, detail=str(exc))


# ── History (Task 2 extension) ─────────────────────────────────────

@router.get(
    "/predict/history",
    summary="Get prediction history",
)
async def get_history(
    limit: int = Query(default=50, ge=1, le=1000),
) -> list[dict]:
    """Return recent predictions, newest first."""
    return sorted(_history, key=lambda r: r["timestamp"], reverse=True)[:limit]


# ── Comparison (Task 2 extension) ──────────────────────────────────

@router.post(
    "/compare",
    summary="Compare multiple properties",
)
async def compare_properties(
    features: list[HousingFeatures],
    model_service: ModelService = Depends(_get_model_service),
) -> list[dict]:
    """Run predictions for side-by-side comparison."""
    if len(features) < 2:
        raise HTTPException(status_code=400, detail="Provide at least 2 properties.")
    if len(features) > 10:
        raise HTTPException(status_code=400, detail="Max 10 properties for comparison.")
    try:
        prices = model_service.predict_batch(features)
        return [
            {"index": i, "predicted_price": round(p, 2), "features": f.model_dump()}
            for i, (p, f) in enumerate(zip(prices, features))
        ]
    except Exception as exc:
        logger.exception("Comparison failed")
        raise HTTPException(status_code=500, detail=str(exc))
