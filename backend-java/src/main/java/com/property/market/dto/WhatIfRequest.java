package com.property.market.dto;

import jakarta.validation.Valid;
import java.util.Map;

public class WhatIfRequest {
    @Valid
    private PropertyFeatures baseFeatures;
    private Map<String, Double> whatIfChanges;

    public WhatIfRequest() {}

    public PropertyFeatures getBaseFeatures() { return baseFeatures; }
    public void setBaseFeatures(PropertyFeatures v) { this.baseFeatures = v; }

    public Map<String, Double> getWhatIfChanges() { return whatIfChanges; }
    public void setWhatIfChanges(Map<String, Double> v) { this.whatIfChanges = v; }
}
