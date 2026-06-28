"""
Health and model-info route handlers — Task 1 format.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, Request

from app.models.schemas import HealthResponse, ModelInfoResponse, CoefficientInfo, ModelMetric
from app.services.model_service import ModelService

logger = logging.getLogger(__name__)

router = APIRouter()


def _get_model_service(request: Request) -> ModelService:
    return request.app.state.model_service


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health check",
)
async def health_check(
    model_service: ModelService = Depends(_get_model_service),
) -> HealthResponse:
    return HealthResponse(
        status="healthy",
        model_loaded=model_service.is_loaded(),
        version=model_service.version(),
    )


@router.get(
    "/model-info",
    response_model=ModelInfoResponse,
    summary="Model information",
    description="Returns the trained model type, coefficients, intercept, and performance metrics.",
)
async def model_info(
    model_service: ModelService = Depends(_get_model_service),
) -> ModelInfoResponse:
    info = model_service.get_model_info()
    return ModelInfoResponse(
        model_type=info["model_type"],
        coefficients=[
            CoefficientInfo(feature=k, coefficient=v)
            for k, v in info.get("coefficients", {}).items()
        ],
        intercept=info.get("intercept", 0.0),
        metrics=[
            ModelMetric(name=m["name"], value=m["value"])
            for m in info.get("metrics", [])
        ],
        training_samples=info.get("training_samples", 0),
        feature_names=info.get("feature_names", []),
    )
