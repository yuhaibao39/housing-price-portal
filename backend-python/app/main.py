"""
FastAPI application entry point — Task 2 Property Value Estimator backend.

Integrates with the LinearRegression model from Task 1.
"""

from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import health, predict
from app.services.model_service import ModelService

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Housing Price Prediction API",
    description=(
        "Predicts house prices based on property features using a\n"
        "LinearRegression model trained on the provided dataset.\n\n"
        "## Features\n"
        "- **square_footage** — Total square footage of the house\n"
        "- **bedrooms** — Number of bedrooms\n"
        "- **bathrooms** — Number of bathrooms\n"
        "- **year_built** — Year the house was built\n"
        "- **lot_size** — Lot size in square feet\n"
        "- **distance_to_city_center** — Distance to city center (miles)\n"
        "- **school_rating** — Nearby school rating (0-10)\n"
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001", "http://127.0.0.1:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, tags=["Health & Info"])
app.include_router(predict.router, tags=["Prediction"])


@app.on_event("startup")
async def startup() -> None:
    logger.info("Starting Housing Price Prediction API…")
    app.state.model_service = ModelService()
    if app.state.model_service.is_loaded():
        info = app.state.model_service.get_model_info()
        logger.info(
            "Model loaded: %s, R²=%.4f, n=%d",
            info["model_type"],
            info["metrics"][0]["value"] if info.get("metrics") else 0,
            info.get("training_samples", 0),
        )
    else:
        logger.error("Model failed to load!")
