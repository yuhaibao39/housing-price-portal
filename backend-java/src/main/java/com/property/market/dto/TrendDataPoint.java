package com.property.market.dto;

public class TrendDataPoint {
    private String label;
    private Double value;
    private String category;

    public TrendDataPoint() {}

    public TrendDataPoint(String label, Double value, String category) {
        this.label = label;
        this.value = value;
        this.category = category;
    }

    public String getLabel() { return label; }
    public void setLabel(String v) { this.label = v; }

    public Double getValue() { return value; }
    public void setValue(Double v) { this.value = v; }

    public String getCategory() { return category; }
    public void setCategory(String v) { this.category = v; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String label, category;
        private Double value;
        public Builder label(String v) { this.label = v; return this; }
        public Builder value(Double v) { this.value = v; return this; }
        public Builder category(String v) { this.category = v; return this; }
        public TrendDataPoint build() { return new TrendDataPoint(label, value, category); }
    }
}
