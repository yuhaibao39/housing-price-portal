package com.property.market.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;

public class CompareRequest {
    @NotEmpty @Size(min = 2, max = 10) @Valid
    private List<PropertyFeatures> properties;
    private boolean includeForecast;

    public CompareRequest() {}

    public List<PropertyFeatures> getProperties() { return properties; }
    public void setProperties(List<PropertyFeatures> v) { this.properties = v; }

    public boolean isIncludeForecast() { return includeForecast; }
    public void setIncludeForecast(boolean v) { this.includeForecast = v; }
}
