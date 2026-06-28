package com.property.market.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;

public class BatchPredictionRequest {
    @NotEmpty @Size(min = 1, max = 10000) @Valid
    private List<PropertyFeatures> properties;

    public BatchPredictionRequest() {}
    public BatchPredictionRequest(List<PropertyFeatures> properties) { this.properties = properties; }

    public List<PropertyFeatures> getProperties() { return properties; }
    public void setProperties(List<PropertyFeatures> v) { this.properties = v; }
}
