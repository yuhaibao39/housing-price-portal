package com.property.market.dto;

public class PredictionResult {
    private Double predictedPrice;
    private PropertyFeatures inputFeatures;

    public PredictionResult() {}

    public PredictionResult(Double predictedPrice, PropertyFeatures inputFeatures) {
        this.predictedPrice = predictedPrice;
        this.inputFeatures = inputFeatures;
    }

    public Double getPredictedPrice() { return predictedPrice; }
    public void setPredictedPrice(Double v) { this.predictedPrice = v; }

    public PropertyFeatures getInputFeatures() { return inputFeatures; }
    public void setInputFeatures(PropertyFeatures v) { this.inputFeatures = v; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Double predictedPrice;
        private PropertyFeatures inputFeatures;

        public Builder predictedPrice(Double v) { this.predictedPrice = v; return this; }
        public Builder inputFeatures(PropertyFeatures v) { this.inputFeatures = v; return this; }
        public PredictionResult build() { return new PredictionResult(predictedPrice, inputFeatures); }
    }
}
