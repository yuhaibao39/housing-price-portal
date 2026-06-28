package com.property.market.dto;

import java.util.List;

public class BatchPredictionResponse {
    private List<PredictionResult> predictions;

    public BatchPredictionResponse() {}
    public BatchPredictionResponse(List<PredictionResult> predictions) { this.predictions = predictions; }

    public List<PredictionResult> getPredictions() { return predictions; }
    public void setPredictions(List<PredictionResult> v) { this.predictions = v; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private List<PredictionResult> predictions;
        public Builder predictions(List<PredictionResult> v) { this.predictions = v; return this; }
        public BatchPredictionResponse build() { return new BatchPredictionResponse(predictions); }
    }
}
