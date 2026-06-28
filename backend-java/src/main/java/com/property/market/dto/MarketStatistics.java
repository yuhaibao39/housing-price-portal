package com.property.market.dto;

import java.util.Map;

public class MarketStatistics {
    private int totalProperties;
    private double avgPrice;
    private double medianPrice;
    private double minPrice;
    private double maxPrice;
    private double stdDevPrice;
    private Map<String, Double> avgByFeature;
    private Map<String, Double> featureCorrelations;

    public MarketStatistics() {}

    public int getTotalProperties() { return totalProperties; }
    public void setTotalProperties(int v) { this.totalProperties = v; }

    public double getAvgPrice() { return avgPrice; }
    public void setAvgPrice(double v) { this.avgPrice = v; }

    public double getMedianPrice() { return medianPrice; }
    public void setMedianPrice(double v) { this.medianPrice = v; }

    public double getMinPrice() { return minPrice; }
    public void setMinPrice(double v) { this.minPrice = v; }

    public double getMaxPrice() { return maxPrice; }
    public void setMaxPrice(double v) { this.maxPrice = v; }

    public double getStdDevPrice() { return stdDevPrice; }
    public void setStdDevPrice(double v) { this.stdDevPrice = v; }

    public Map<String, Double> getAvgByFeature() { return avgByFeature; }
    public void setAvgByFeature(Map<String, Double> v) { this.avgByFeature = v; }

    public Map<String, Double> getFeatureCorrelations() { return featureCorrelations; }
    public void setFeatureCorrelations(Map<String, Double> v) { this.featureCorrelations = v; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private final MarketStatistics obj = new MarketStatistics();
        public Builder totalProperties(int v) { obj.totalProperties = v; return this; }
        public Builder avgPrice(double v) { obj.avgPrice = v; return this; }
        public Builder medianPrice(double v) { obj.medianPrice = v; return this; }
        public Builder minPrice(double v) { obj.minPrice = v; return this; }
        public Builder maxPrice(double v) { obj.maxPrice = v; return this; }
        public Builder stdDevPrice(double v) { obj.stdDevPrice = v; return this; }
        public Builder avgByFeature(Map<String, Double> v) { obj.avgByFeature = v; return this; }
        public Builder featureCorrelations(Map<String, Double> v) { obj.featureCorrelations = v; return this; }
        public MarketStatistics build() { return obj; }
    }
}
