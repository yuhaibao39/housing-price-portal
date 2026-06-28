package com.property.market.dto;

import java.util.Map;

public class WhatIfResponse {
    private PredictionResult baseline;
    private PredictionResult modified;
    private Map<String, Double> changes;
    private double percentageChange;

    public WhatIfResponse() {}

    public PredictionResult getBaseline() { return baseline; }
    public void setBaseline(PredictionResult v) { this.baseline = v; }

    public PredictionResult getModified() { return modified; }
    public void setModified(PredictionResult v) { this.modified = v; }

    public Map<String, Double> getChanges() { return changes; }
    public void setChanges(Map<String, Double> v) { this.changes = v; }

    public double getPercentageChange() { return percentageChange; }
    public void setPercentageChange(double v) { this.percentageChange = v; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private final WhatIfResponse obj = new WhatIfResponse();
        public Builder baseline(PredictionResult v) { obj.baseline = v; return this; }
        public Builder modified(PredictionResult v) { obj.modified = v; return this; }
        public Builder changes(Map<String, Double> v) { obj.changes = v; return this; }
        public Builder percentageChange(double v) { obj.percentageChange = v; return this; }
        public WhatIfResponse build() { return obj; }
    }
}
