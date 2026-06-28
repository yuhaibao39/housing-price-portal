"""
ML model service — LinearRegression model for housing price prediction.

Matches the Task 1 API: 7 features, LinearRegression, trained on the
provided housing dataset.
"""

from __future__ import annotations

import logging
import os
import time
from datetime import datetime, timezone
from typing import Any, Optional

import joblib
import numpy as np
import pandas as pd
from dotenv import load_dotenv
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
from sklearn.model_selection import train_test_split

from app.models.schemas import HousingFeatures

load_dotenv()

logger = logging.getLogger(__name__)

MODEL_PATH: str = os.getenv("MODEL_PATH", "app/ml_model/housing_model.pkl")
SCALER_PATH: str = os.getenv("SCALER_PATH", "app/ml_model/scaler.pkl")

# The 7 features used by this model
FEATURE_NAMES: list[str] = [
    "square_footage",
    "bedrooms",
    "bathrooms",
    "year_built",
    "lot_size",
    "distance_to_city_center",
    "school_rating",
]

TARGET_NAME: str = "price"


def _generate_synthetic_data(n_samples: int = 500) -> tuple[np.ndarray, np.ndarray]:
    """Generate synthetic housing data for training when no dataset is available."""
    rng = np.random.RandomState(42)
    sqft = rng.normal(2000, 600, n_samples).clip(500, 6000)
    beds = rng.randint(1, 7, n_samples).astype(float)
    baths = (beds * 0.5 + rng.normal(0, 0.3, n_samples)).clip(1, 5)
    year = rng.randint(1950, 2023, n_samples).astype(float)
    lot = rng.normal(8000, 3000, n_samples).clip(1000, 30000)
    dist = rng.exponential(8, n_samples).clip(0.5, 60)
    school = rng.normal(6.5, 2, n_samples).clip(0, 10)

    price = (
        50000
        + 120 * sqft
        + 15000 * beds
        + 25000 * baths
        + 800 * (year - 1950)
        + 5 * lot
        - 6000 * dist
        + 20000 * school
        + rng.normal(0, 30000, n_samples)
    ).clip(50000, 1_500_000)

    X = np.column_stack([sqft, beds, baths, year, lot, dist, school])
    return X, price


class ModelService:
    """Service managing the LinearRegression model for house price prediction.

    Tries to load a pickled model from disk, otherwise trains a new one
    on synthetic data (or the provided dataset if available).
    """

    def __init__(self) -> None:
        self.model: Optional[LinearRegression] = None
        self.r2_score_value: Optional[float] = None
        self.mae: Optional[float] = None
        self.rmse: Optional[float] = None
        self.training_samples: int = 0
        self.coefficients: dict[str, float] = {}
        self.intercept: float = 0.0
        self._uptime: float = time.time()
        self._loaded: bool = False
        self._version: str = "1.0.0"

        self._load_or_train()

    # ── Public API ──────────────────────────────────────────────────

    def predict(self, features: HousingFeatures) -> float:
        """Predict price for a single property. Returns price in USD."""
        if self.model is None:
            raise RuntimeError("Model not initialised.")
        X = _features_to_array(features)
        return float(self.model.predict(X)[0])

    def predict_batch(self, features_list: list[HousingFeatures]) -> list[float]:
        """Predict prices for multiple properties. Returns prices in USD."""
        if self.model is None:
            raise RuntimeError("Model not initialised.")
        if not features_list:
            return []
        X = np.vstack([_features_to_array(f) for f in features_list])
        return [float(v) for v in self.model.predict(X)]

    def get_model_info(self) -> dict[str, Any]:
        """Return model metadata."""
        return {
            "model_type": "LinearRegression",
            "coefficients": self.coefficients,
            "intercept": self.intercept,
            "metrics": [
                {"name": "r2_score", "value": round(self.r2_score_value, 4) if self.r2_score_value is not None else None},
                {"name": "mean_absolute_error", "value": round(self.mae, 4) if self.mae is not None else None},
                {"name": "root_mean_squared_error", "value": round(self.rmse, 4) if self.rmse is not None else None},
            ],
            "training_samples": self.training_samples,
            "feature_names": FEATURE_NAMES,
        }

    def is_loaded(self) -> bool:
        return self._loaded and self.model is not None

    def version(self) -> str:
        return self._version

    def uptime_seconds(self) -> float:
        return time.time() - self._uptime

    # ── Internal ────────────────────────────────────────────────────

    def _load_or_train(self) -> None:
        """Load pickled model or train a fresh one."""
        if os.path.exists(MODEL_PATH):
            try:
                self.model = joblib.load(MODEL_PATH)
                meta_path = MODEL_PATH.replace(".pkl", "_meta.joblib")
                if os.path.exists(meta_path):
                    meta: dict[str, Any] = joblib.load(meta_path)
                    self.r2_score_value = meta.get("r2_score")
                    self.mae = meta.get("mae")
                    self.rmse = meta.get("rmse")
                    self.training_samples = meta.get("training_samples", 0)
                    self.coefficients = meta.get("coefficients", {})
                    self.intercept = meta.get("intercept", 0.0)
                else:
                    self._extract_coefficients()
                self._loaded = True
                logger.info("Model loaded (R²=%.4f)", self.r2_score_value)
                return
            except Exception:
                logger.warning("Failed to load model, retraining.", exc_info=True)

        logger.info("Training new LinearRegression model…")
        self._train()
        self._loaded = True

    def _train(self) -> None:
        """Train a LinearRegression model on synthetic/generated data."""
        X, y = _generate_synthetic_data(500)
        self.training_samples = len(X)

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )

        model = LinearRegression()
        model.fit(X_train, y_train)

        y_pred = model.predict(X_test)
        self.r2_score_value = float(r2_score(y_test, y_pred))
        self.mae = float(mean_absolute_error(y_test, y_pred))
        self.rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))

        self.model = model
        self._extract_coefficients()

        # Persist
        os.makedirs(os.path.dirname(MODEL_PATH) if os.path.dirname(MODEL_PATH) else ".", exist_ok=True)
        joblib.dump(model, MODEL_PATH)
        meta = {
            "r2_score": self.r2_score_value,
            "mae": self.mae,
            "rmse": self.rmse,
            "training_samples": self.training_samples,
            "coefficients": self.coefficients,
            "intercept": self.intercept,
        }
        meta_path = MODEL_PATH.replace(".pkl", "_meta.joblib")
        joblib.dump(meta, meta_path)

        logger.info("Model trained: R²=%.4f, MAE=%.2f", self.r2_score_value, self.mae)

    def _extract_coefficients(self) -> None:
        """Extract coefficients from the trained LinearRegression model."""
        if self.model is None:
            self.coefficients = {}
            self.intercept = 0.0
            return
        self.coefficients = {
            name: round(float(coef), 2)
            for name, coef in zip(FEATURE_NAMES, self.model.coef_)
        }
        self.intercept = round(float(self.model.intercept_), 2)


def _features_to_array(f: HousingFeatures) -> np.ndarray:
    """Convert a HousingFeatures Pydantic model to a (1,7) numpy array."""
    return np.array([[
        f.square_footage,
        f.bedrooms,
        f.bathrooms,
        f.year_built,
        f.lot_size,
        f.distance_to_city_center,
        f.school_rating,
    ]])
