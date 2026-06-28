"""
Pydantic schemas matching the Task 1 Housing Price Prediction API.

Features: square_footage, bedrooms, bathrooms, year_built, lot_size,
          distance_to_city_center, school_rating
Model: LinearRegression
"""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field


class HousingFeatures(BaseModel):
    """The 7 housing features used by the LinearRegression model."""

    square_footage: float = Field(
        ..., ge=0.0,
        description="Total square footage of the house",
        examples=[1850],
    )
    bedrooms: int = Field(
        ..., ge=0,
        description="Number of bedrooms",
        examples=[3],
    )
    bathrooms: float = Field(
        ..., ge=0.0,
        description="Number of bathrooms",
        examples=[2],
    )
    year_built: int = Field(
        ..., ge=1900, le=2030,
        description="Year the house was built",
        examples=[1998],
    )
    lot_size: float = Field(
        ..., ge=0.0,
        description="Lot size in square feet",
        examples=[7500],
    )
    distance_to_city_center: float = Field(
        ..., ge=0.0,
        description="Distance to city center (miles)",
        examples=[5.6],
    )
    school_rating: float = Field(
        ..., ge=0.0, le=10.0,
        description="Nearby school rating (0-10)",
        examples=[8.2],
    )

    class Config:
        json_schema_extra = {
            "example": {
                "square_footage": 1850,
                "bedrooms": 3,
                "bathrooms": 2,
                "year_built": 1998,
                "lot_size": 7500,
                "distance_to_city_center": 5.6,
                "school_rating": 8.2,
            }
        }


class PredictionRequest(BaseModel):
    """Request body for single prediction — Task 1 format."""
    features: HousingFeatures


class SinglePredictionResponse(BaseModel):
    """Response for single prediction — Task 1 format."""
    predicted_price: float = Field(..., description="Predicted house price (USD)")
    input_features: HousingFeatures


class BatchPredictionRequest(BaseModel):
    """Request body for batch prediction — Task 1 format."""
    features: list[HousingFeatures] = Field(
        ..., min_length=1, max_length=10_000,
        description="List of housing feature sets",
    )


class BatchPredictionResponse(BaseModel):
    """Response for batch prediction — Task 1 format."""
    predictions: list[float] = Field(..., description="List of predicted prices (USD)")
    count: int


class CoefficientInfo(BaseModel):
    """Model coefficient info."""
    feature: str
    coefficient: float


class ModelMetric(BaseModel):
    """Individual model performance metric."""
    name: str
    value: float


class ModelInfoResponse(BaseModel):
    """Response for /model-info endpoint — Task 1 format."""
    model_type: str
    coefficients: list[CoefficientInfo]
    intercept: float
    metrics: list[ModelMetric]
    training_samples: int
    feature_names: list[str]


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    model_loaded: bool
    version: str


class ErrorResponse(BaseModel):
    """Standard error response."""
    error: str
    detail: Optional[str] = None
