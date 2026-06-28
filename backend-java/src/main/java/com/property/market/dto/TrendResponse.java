package com.property.market.dto;

import java.util.List;

public class TrendResponse {
    private List<TrendDataPoint> priceByIncome;
    private List<TrendDataPoint> priceByAge;
    private List<TrendDataPoint> priceByRegion;

    public TrendResponse() {}

    public List<TrendDataPoint> getPriceByIncome() { return priceByIncome; }
    public void setPriceByIncome(List<TrendDataPoint> v) { this.priceByIncome = v; }

    public List<TrendDataPoint> getPriceByAge() { return priceByAge; }
    public void setPriceByAge(List<TrendDataPoint> v) { this.priceByAge = v; }

    public List<TrendDataPoint> getPriceByRegion() { return priceByRegion; }
    public void setPriceByRegion(List<TrendDataPoint> v) { this.priceByRegion = v; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private final TrendResponse obj = new TrendResponse();
        public Builder priceByIncome(List<TrendDataPoint> v) { obj.priceByIncome = v; return this; }
        public Builder priceByAge(List<TrendDataPoint> v) { obj.priceByAge = v; return this; }
        public Builder priceByRegion(List<TrendDataPoint> v) { obj.priceByRegion = v; return this; }
        public TrendResponse build() { return obj; }
    }
}
