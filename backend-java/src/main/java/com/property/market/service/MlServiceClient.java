package com.property.market.service;

import com.property.market.config.CacheConfig.MlServiceProperties;
import com.property.market.dto.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class MlServiceClient {

    private static final Logger log = LoggerFactory.getLogger(MlServiceClient.class);
    private final RestTemplate restTemplate;
    private final String baseUrl;

    public MlServiceClient(MlServiceProperties properties) {
        this.restTemplate = new RestTemplate();
        this.baseUrl = properties.getUrl();
    }

    /** Call Task 1 POST /predict with {"features":{...}} */
    public PredictionResult predict(PropertyFeatures features) {
        String url = baseUrl + "/predict";
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            // Task 1 expects {"features": {...}}
            Map<String, Object> body = new HashMap<>();
            body.put("features", toTask1Features(features));
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    url, HttpMethod.POST, request,
                    new ParameterizedTypeReference<Map<String, Object>>() {});
            Map<String, Object> resp = response.getBody();
            if (resp == null) throw new RuntimeException("Empty response from Task 1");
            return PredictionResult.builder()
                    .predictedPrice(((Number) resp.get("predicted_price")).doubleValue())
                    .inputFeatures(features)
                    .build();
        } catch (RestClientException e) {
            log.error("Failed to call Task 1 /predict: {}", e.getMessage());
            throw new RuntimeException("Task 1 ML service unavailable: " + e.getMessage());
        }
    }

    /** Call Task 1 POST /predict/batch with {"features":[...]} */
    public List<PredictionResult> predictBatch(List<PropertyFeatures> featuresList) {
        String url = baseUrl + "/predict/batch";
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            List<Map<String, Object>> task1Features = featuresList.stream()
                    .map(MlServiceClient::toTask1Features)
                    .toList();
            Map<String, Object> body = new HashMap<>();
            body.put("features", task1Features);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            ResponseEntity<Map<String, Object>> resp = restTemplate.exchange(
                    url, HttpMethod.POST, request,
                    new ParameterizedTypeReference<Map<String, Object>>() {});
            Map<String, Object> data = resp.getBody();
            if (data == null) return Collections.emptyList();

            @SuppressWarnings("unchecked")
            List<Number> predictions = (List<Number>) data.get("predictions");
            if (predictions == null) return Collections.emptyList();

            List<PredictionResult> results = new ArrayList<>();
            for (int i = 0; i < predictions.size(); i++) {
                results.add(PredictionResult.builder()
                        .predictedPrice(predictions.get(i).doubleValue())
                        .inputFeatures(i < featuresList.size() ? featuresList.get(i) : null)
                        .build());
            }
            return results;
        } catch (RestClientException e) {
            log.error("Failed to call Task 1 /predict/batch: {}", e.getMessage());
            throw new RuntimeException("Task 1 batch prediction unavailable");
        }
    }

    @Cacheable("modelInfo")
    public Map<String, Object> getModelInfo() {
        String url = baseUrl + "/model-info";
        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    url, HttpMethod.GET, null, new ParameterizedTypeReference<>() {});
            return response.getBody();
        } catch (RestClientException e) {
            log.error("Failed to get model info: {}", e.getMessage());
            return Collections.emptyMap();
        }
    }

    public boolean isHealthy() {
        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    baseUrl + "/health", HttpMethod.GET, null,
                    new ParameterizedTypeReference<>() {});
            Map<String, Object> body = response.getBody();
            return body != null && "healthy".equals(body.get("status"));
        } catch (RestClientException e) {
            return false;
        }
    }

    /**
     * Convert our PropertyFeatures to Task 1's feature map using snake_case keys
     * (matching Task 1's HousingFeatures schema).
     */
    private static Map<String, Object> toTask1Features(PropertyFeatures f) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("square_footage", f.getSquareFootage());
        map.put("bedrooms", f.getBedrooms());
        map.put("bathrooms", f.getBathrooms());
        map.put("year_built", f.getYearBuilt());
        map.put("lot_size", f.getLotSize());
        map.put("distance_to_city_center", f.getDistanceToCityCenter());
        map.put("school_rating", f.getSchoolRating());
        return map;
    }
}
