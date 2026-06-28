package com.property.market.dto;

import jakarta.validation.constraints.*;

public class PropertyFeatures {

    @NotNull @DecimalMin("0.0")
    private Double squareFootage;

    @NotNull @Min(0) @Max(10)
    private Integer bedrooms;

    @NotNull @DecimalMin("1.0")
    private Double bathrooms;

    @NotNull @Min(1900) @Max(2030)
    private Integer yearBuilt;

    @NotNull @DecimalMin("0.0")
    private Double lotSize;

    @NotNull @DecimalMin("0.0")
    private Double distanceToCityCenter;

    @NotNull @DecimalMin("0.0") @DecimalMax("10.0")
    private Double schoolRating;

    public PropertyFeatures() {}

    public PropertyFeatures(Double squareFootage, Integer bedrooms, Double bathrooms,
                            Integer yearBuilt, Double lotSize, Double distanceToCityCenter,
                            Double schoolRating) {
        this.squareFootage = squareFootage;
        this.bedrooms = bedrooms;
        this.bathrooms = bathrooms;
        this.yearBuilt = yearBuilt;
        this.lotSize = lotSize;
        this.distanceToCityCenter = distanceToCityCenter;
        this.schoolRating = schoolRating;
    }

    public Double getSquareFootage() { return squareFootage; }
    public void setSquareFootage(Double v) { this.squareFootage = v; }

    public Integer getBedrooms() { return bedrooms; }
    public void setBedrooms(Integer v) { this.bedrooms = v; }

    public Double getBathrooms() { return bathrooms; }
    public void setBathrooms(Double v) { this.bathrooms = v; }

    public Integer getYearBuilt() { return yearBuilt; }
    public void setYearBuilt(Integer v) { this.yearBuilt = v; }

    public Double getLotSize() { return lotSize; }
    public void setLotSize(Double v) { this.lotSize = v; }

    public Double getDistanceToCityCenter() { return distanceToCityCenter; }
    public void setDistanceToCityCenter(Double v) { this.distanceToCityCenter = v; }

    public Double getSchoolRating() { return schoolRating; }
    public void setSchoolRating(Double v) { this.schoolRating = v; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Double squareFootage, bathrooms, lotSize, distanceToCityCenter, schoolRating;
        private Integer bedrooms, yearBuilt;

        public Builder squareFootage(Double v) { this.squareFootage = v; return this; }
        public Builder bedrooms(Integer v) { this.bedrooms = v; return this; }
        public Builder bathrooms(Double v) { this.bathrooms = v; return this; }
        public Builder yearBuilt(Integer v) { this.yearBuilt = v; return this; }
        public Builder lotSize(Double v) { this.lotSize = v; return this; }
        public Builder distanceToCityCenter(Double v) { this.distanceToCityCenter = v; return this; }
        public Builder schoolRating(Double v) { this.schoolRating = v; return this; }

        public PropertyFeatures build() {
            return new PropertyFeatures(squareFootage, bedrooms, bathrooms,
                    yearBuilt, lotSize, distanceToCityCenter, schoolRating);
        }
    }
}
