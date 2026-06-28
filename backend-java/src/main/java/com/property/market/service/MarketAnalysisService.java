package com.property.market.service;

import com.property.market.dto.*;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.DoubleStream;

@Service
public class MarketAnalysisService {

    private static final String[] REGIONS = {
            "Los Angeles", "San Francisco", "San Diego", "Sacramento", "San Jose",
            "Fresno", "Oakland", "Bakersfield", "Riverside", "Long Beach"
    };

    private static final String[] REGION_CODES = {
            "LA", "SF", "SD", "SAC", "SJ", "FRE", "OAK", "BAK", "RIV", "LB"
    };

    @Cacheable("marketStatistics")
    public MarketStatistics getStatistics() {
        Random rng = new Random(42);
        int count = 20000;
        double[] prices = rng.doubles(count, 150_000, 800_000).toArray();
        Arrays.sort(prices);
        double avg = DoubleStream.of(prices).average().orElse(400_000);
        double median = prices[prices.length / 2];
        double min = prices[0];
        double max = prices[prices.length - 1];
        double variance = DoubleStream.of(prices).map(p -> (p - avg) * (p - avg)).average().orElse(0);
        double stdDev = Math.sqrt(variance);

        Map<String, Double> featureCorrelations = new LinkedHashMap<>();
        featureCorrelations.put("square_footage", 0.78);
        featureCorrelations.put("lot_size", 0.52);
        featureCorrelations.put("bathrooms", 0.41);
        featureCorrelations.put("school_rating", 0.38);
        featureCorrelations.put("year_built", 0.32);
        featureCorrelations.put("bedrooms", 0.29);
        featureCorrelations.put("distance_to_city_center", -0.45);

        Map<String, Double> avgByFeature = new LinkedHashMap<>();
        avgByFeature.put("square_footage", 1850.0);
        avgByFeature.put("bedrooms", 3.0);
        avgByFeature.put("bathrooms", 2.0);
        avgByFeature.put("lot_size", 7500.0);

        return MarketStatistics.builder()
                .totalProperties(count)
                .avgPrice(Math.round(avg * 100.0) / 100.0)
                .medianPrice(Math.round(median * 100.0) / 100.0)
                .minPrice(Math.round(min * 100.0) / 100.0)
                .maxPrice(Math.round(max * 100.0) / 100.0)
                .stdDevPrice(Math.round(stdDev * 100.0) / 100.0)
                .avgByFeature(avgByFeature)
                .featureCorrelations(featureCorrelations)
                .build();
    }

    @Cacheable("trends")
    public TrendResponse getTrends() {
        List<TrendDataPoint> priceByIncome = Arrays.asList(
                TrendDataPoint.builder().label("Small (<1500 sf)").value(220000.0).category("Size").build(),
                TrendDataPoint.builder().label("Medium (1500-2500 sf)").value(380000.0).category("Size").build(),
                TrendDataPoint.builder().label("Large (2500-4000 sf)").value(550000.0).category("Size").build(),
                TrendDataPoint.builder().label("XL (>4000 sf)").value(720000.0).category("Size").build()
        );

        List<TrendDataPoint> priceByAge = Arrays.asList(
                TrendDataPoint.builder().label("Pre-1950").value(180000.0).category("Age").build(),
                TrendDataPoint.builder().label("1950-1980").value(250000.0).category("Age").build(),
                TrendDataPoint.builder().label("1980-2000").value(380000.0).category("Age").build(),
                TrendDataPoint.builder().label("2000-2020").value(520000.0).category("Age").build(),
                TrendDataPoint.builder().label("2020+").value(620000.0).category("Age").build()
        );

        Random rng = new Random(99);
        List<TrendDataPoint> priceByRegion = new ArrayList<>();
        for (int i = 0; i < REGIONS.length; i++) {
            priceByRegion.add(TrendDataPoint.builder()
                    .label(REGIONS[i])
                    .value(Math.round((200000 + rng.nextDouble() * 500000) * 100.0) / 100.0)
                    .category(REGION_CODES[i])
                    .build());
        }

        return TrendResponse.builder()
                .priceByIncome(priceByIncome)
                .priceByAge(priceByAge)
                .priceByRegion(priceByRegion)
                .build();
    }
}
