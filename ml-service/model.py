"""
Model training, prediction, and Flask API for California Housing price prediction.

This module:
- Loads the California housing dataset from sklearn
- Trains a RandomForestRegressor model
- Scales features with StandardScaler
- Serves predictions via a Flask REST API
- Works on Windows (waitress) and Linux (gunicorn)
"""

import os
import logging
from datetime import datetime, timezone

import joblib
import numpy as np
import pandas as pd
from flask import Flask, jsonify, request
from flask_cors import CORS
from sklearn.datasets import fetch_california_housing
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

# ── Logging ────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# ── Paths ──────────────────────────────────────────────────────────
MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")
MODEL_PATH = os.path.join(MODEL_DIR, "california_housing_model.joblib")
SCALER_PATH = os.path.join(MODEL_DIR, "scaler.joblib")
METRICS_PATH = os.path.join(MODEL_DIR, "metrics.json")

# ── Feature metadata ───────────────────────────────────────────────
FEATURE_NAMES = [
    "MedInc", "HouseAge", "AveRooms", "AveBedrms",
    "Population", "AveOccup", "Latitude", "Longitude",
]

# ── Global state ───────────────────────────────────────────────────
_model = None
_scaler = None
_metrics = None
_training_date = None
_feature_importance = None

# ── Flask app ──────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app)


# ====================================================================
# Model training / loading
# ====================================================================

def train_model():
    """Train a RandomForestRegressor on the California housing dataset."""
    global _training_date
    logger.info("Loading California housing dataset...")
    data = fetch_california_housing()
    X = pd.DataFrame(data.data, columns=data.feature_names)
    y = data.target
    logger.info(f"Dataset loaded: {X.shape[0]} samples, {X.shape[1]} features")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    logger.info("Training RandomForestRegressor (n_estimators=100)...")
    model = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
    model.fit(X_train_scaled, y_train)

    y_pred = model.predict(X_test_scaled)
    r2 = r2_score(y_test, y_pred)
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    logger.info(f"Evaluation: R²={r2:.4f}, MAE={mae:.4f}, RMSE={rmse:.4f}")

    _training_date = datetime.now(timezone.utc).isoformat()

    global _feature_importance
    importances = model.feature_importances_
    _feature_importance = dict(
        sorted(zip(FEATURE_NAMES, importances), key=lambda x: x[1], reverse=True)
    )

    metrics = {
        "r2_score": round(float(r2), 4),
        "mae": round(float(mae), 4),
        "rmse": round(float(rmse), 4),
        "model_type": "RandomForestRegressor",
        "n_estimators": 100,
        "n_features": len(FEATURE_NAMES),
        "n_samples": X.shape[0],
        "training_date": _training_date,
    }

    os.makedirs(MODEL_DIR, exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)
    import json
    with open(METRICS_PATH, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)
    logger.info(f"Artifacts saved to {MODEL_DIR}")

    return model, scaler, metrics


def load_model():
    """Load trained model from disk, or train a new one."""
    global _model, _scaler, _metrics, _training_date, _feature_importance

    if os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH):
        logger.info("Loading saved model from disk...")
        _model = joblib.load(MODEL_PATH)
        _scaler = joblib.load(SCALER_PATH)

        import json
        if os.path.exists(METRICS_PATH):
            with open(METRICS_PATH, "r", encoding="utf-8") as f:
                _metrics = json.load(f)
            _training_date = _metrics.get("training_date")
        else:
            _metrics = {"model_type": "RandomForestRegressor", "n_estimators": 100}

        importances = _model.feature_importances_
        _feature_importance = dict(
            sorted(zip(FEATURE_NAMES, importances), key=lambda x: x[1], reverse=True)
        )
        logger.info("Model loaded successfully.")
    else:
        logger.info("No saved model found. Training new model...")
        _model, _scaler, _metrics = train_model()

    if _metrics:
        _metrics.setdefault("model_type", "RandomForestRegressor")
        _metrics.setdefault("n_estimators", 100)
        _metrics.setdefault("n_features", len(FEATURE_NAMES))

    return _model, _scaler, _metrics


# ====================================================================
# Prediction helpers
# ====================================================================

def _predict_one(features_arr):
    """Predict for a single sample. Returns (prediction, confidence_interval)."""
    global _model, _scaler
    features_scaled = _scaler.transform(features_arr)
    pred = round(float(_model.predict(features_scaled)[0]), 4)

    tree_preds = np.array([t.predict(features_scaled)[0] for t in _model.estimators_])
    margin = 1.96 * float(np.std(tree_preds))
    ci_lower = max(0.0, round(pred - margin, 4))
    ci_upper = round(pred + margin, 4)
    return pred, [ci_lower, ci_upper]


# ====================================================================
# Flask routes
# ====================================================================

@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({
        "status": "healthy",
        "model_loaded": _model is not None,
        "version": "1.0.0",
    })


@app.route("/info", methods=["GET"])
def info():
    """Model metadata endpoint."""
    global _metrics, _feature_importance, _training_date
    if _metrics is None:
        return jsonify({"error": "Model not loaded yet"}), 503
    return jsonify({
        "model_type": _metrics.get("model_type", "RandomForestRegressor"),
        "n_estimators": _metrics.get("n_estimators", 100),
        "n_features": _metrics.get("n_features", len(FEATURE_NAMES)),
        "n_samples": _metrics.get("n_samples"),
        "feature_names": FEATURE_NAMES,
        "feature_importance": _feature_importance,
        "r2_score": _metrics.get("r2_score"),
        "mae": _metrics.get("mae"),
        "rmse": _metrics.get("rmse"),
        "training_date": _metrics.get("training_date", _training_date),
    })


@app.route("/predict", methods=["POST"])
def predict():
    """Single prediction — expects JSON body with 8 California housing features."""
    global _model, _scaler, _feature_importance

    if _model is None or _scaler is None:
        return jsonify({"error": "Model not loaded"}), 503

    data = request.get_json(force=True)

    # Support both {"features": [...]} and flat array
    if data is None:
        return jsonify({"error": "Invalid JSON"}), 400
    if isinstance(data, dict) and "features" in data:
        features = data["features"]
    elif isinstance(data, list):
        features = data
    else:
        features = list(data.values()) if isinstance(data, dict) else data

    try:
        arr = np.array(features, dtype=float).reshape(1, -1)
    except (ValueError, TypeError):
        return jsonify({"error": f"Expected {len(FEATURE_NAMES)} numeric values"}), 400

    if arr.shape[1] != len(FEATURE_NAMES):
        return jsonify({
            "error": f"Expected {len(FEATURE_NAMES)} features, got {arr.shape[1]}",
            "expected_order": FEATURE_NAMES,
        }), 400

    pred_val, ci = _predict_one(arr)
    return jsonify({
        "predicted_value": pred_val,
        "confidence_interval": ci,
        "feature_importance": _feature_importance,
    })


@app.route("/predict/batch", methods=["POST"])
def predict_batch():
    """Batch prediction — expects JSON array of feature arrays."""
    global _model, _scaler, _feature_importance

    if _model is None or _scaler is None:
        return jsonify({"error": "Model not loaded"}), 503

    data = request.get_json(force=True)

    if isinstance(data, dict) and "features" in data:
        features_list = data["features"]
    elif isinstance(data, list):
        features_list = data
    else:
        return jsonify({"error": "Expected array of feature arrays"}), 400

    try:
        arr = np.array(features_list, dtype=float)
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid numeric values"}), 400

    if arr.ndim == 1:
        arr = arr.reshape(1, -1)
    if arr.shape[1] != len(FEATURE_NAMES):
        return jsonify({
            "error": f"Expected {len(FEATURE_NAMES)} features per sample, got {arr.shape[1]}",
        }), 400

    features_scaled = _scaler.transform(arr)
    preds = _model.predict(features_scaled)

    all_tree_preds = np.array([t.predict(features_scaled) for t in _model.estimators_])

    results = []
    for i, p in enumerate(preds):
        pred_val = round(float(p), 4)
        margin = 1.96 * float(np.std(all_tree_preds[:, i]))
        results.append({
            "predicted_value": pred_val,
            "confidence_interval": [max(0.0, round(pred_val - margin, 4)), round(pred_val + margin, 4)],
            "feature_importance": _feature_importance,
        })

    return jsonify({"predictions": results, "count": len(results)})


# ====================================================================
# Startup
# ====================================================================

@app.before_request
def ensure_model():
    """Lazy-load model on first request if not already loaded."""
    global _model
    if _model is None:
        load_model()


if __name__ == "__main__":
    import sys
    port = int(os.environ.get("PORT", 8002))

    # On Windows, use Flask dev server or waitress
    if sys.platform == "win32":
        try:
            from waitress import serve
            print(f"Starting Waitress on port {port}...")
            serve(app, host="0.0.0.0", port=port)
        except ImportError:
            print(f"Waitress not found. Using Flask dev server on port {port}...")
            app.run(host="0.0.0.0", port=port, debug=False)
    else:
        # On Linux, gunicorn is the preferred way
        app.run(host="0.0.0.0", port=port, debug=False)
