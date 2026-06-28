/** TypeScript types matching the Task 1 Housing Price Prediction API (port 8000) */

/** The 7 features used by the LinearRegression model */
export interface HousingFeatures {
  square_footage: number;
  bedrooms: number;
  bathrooms: number;
  year_built: number;
  lot_size: number;
  distance_to_city_center: number;
  school_rating: number;
}

/** Request body for single prediction */
export interface PredictionRequest {
  features: HousingFeatures;
}

/** Response from single prediction */
export interface SinglePredictionResponse {
  predicted_price: number;
  input_features: HousingFeatures;
}

/** Request body for batch prediction */
export interface BatchPredictionRequest {
  features: HousingFeatures[];
}

/** Response from batch prediction */
export interface BatchPredictionResponse {
  predictions: number[];
  count: number;
}

/** Health check response */
export interface HealthResponse {
  status: string;
  model_loaded: boolean;
  version: string;
}

/** Individual model coefficient */
export interface CoefficientInfo {
  feature: string;
  coefficient: number;
}

/** Individual model metric */
export interface ModelMetric {
  name: string;
  value: number;
}

/** Model-info response */
export interface ModelInfoResponse {
  model_type: string;
  coefficients: CoefficientInfo[];
  intercept: number;
  metrics: ModelMetric[];
  training_samples: number;
  feature_names: string[];
}

// ── History (local only, not provided by Task 1) ──

export interface PredictionHistory {
  id: string;
  features: HousingFeatures;
  predicted_price: number;
  timestamp: string;
}

// ── Market Analysis types (from Java backend) ──

export interface TrendDataPoint {
  label: string;
  value: number;
  category: string;
}

export interface TrendResponse {
  priceByIncome: TrendDataPoint[];
  priceByAge: TrendDataPoint[];
  priceByRegion: TrendDataPoint[];
}

export interface MarketStatistics {
  totalProperties: number;
  avgPrice: number;
  medianPrice: number;
  minPrice: number;
  maxPrice: number;
  stdDevPrice: number;
  avgByFeature: Record<string, number>;
  featureCorrelations: Record<string, number>;
}

// ── What-If (Java backend) ──

export interface WhatIfRequest {
  baseFeatures: HousingFeatures;
  whatIfChanges: Record<string, number>;
}

export interface WhatIfResponse {
  baseline: { predicted_price: number };
  modified: { predicted_price: number };
  changes: Record<string, number>;
  percentageChange: number;
}

// ── Default values ──

export const DEFAULT_FEATURES: HousingFeatures = {
  square_footage: 1850,
  bedrooms: 3,
  bathrooms: 2,
  year_built: 1998,
  lot_size: 7500,
  distance_to_city_center: 5.6,
  school_rating: 8.2,
};

/** Feature metadata for form labels and validation */
export const FEATURE_META = {
  square_footage: {
    label: "Square Footage",
    unit: "sq ft",
    min: 0, max: 20000, step: 50,
    help: "Total square footage of the house",
  },
  bedrooms: {
    label: "Bedrooms",
    unit: "rooms",
    min: 0, max: 10, step: 1,
    help: "Number of bedrooms",
  },
  bathrooms: {
    label: "Bathrooms",
    unit: "rooms",
    min: 1, max: 10, step: 0.5,
    help: "Number of bathrooms",
  },
  year_built: {
    label: "Year Built",
    unit: "year",
    min: 1900, max: 2030, step: 1,
    help: "Year the house was built",
  },
  lot_size: {
    label: "Lot Size",
    unit: "sq ft",
    min: 0, max: 50000, step: 100,
    help: "Lot size in square feet",
  },
  distance_to_city_center: {
    label: "Distance to City",
    unit: "miles",
    min: 0, max: 100, step: 0.1,
    help: "Distance to city center (miles)",
  },
  school_rating: {
    label: "School Rating",
    unit: "0–10",
    min: 0, max: 10, step: 0.1,
    help: "Nearby school rating",
  },
} as const;
