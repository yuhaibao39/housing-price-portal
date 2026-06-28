package com.property.market.controller;

import com.property.market.dto.*;
import com.property.market.service.MarketAnalysisService;
import com.property.market.service.MlServiceClient;
import com.opencsv.CSVWriter;
import jakarta.validation.Valid;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.CacheManager;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.io.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/v2")
public class MarketController {

    private static final Logger log = LoggerFactory.getLogger(MarketController.class);
    private final MlServiceClient mlServiceClient;
    private final MarketAnalysisService marketAnalysisService;
    private final CacheManager cacheManager;

    public MarketController(MlServiceClient mlServiceClient,
                            MarketAnalysisService marketAnalysisService,
                            CacheManager cacheManager) {
        this.mlServiceClient = mlServiceClient;
        this.marketAnalysisService = marketAnalysisService;
        this.cacheManager = cacheManager;
    }

    // ── Health ──

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        boolean mlHealthy = mlServiceClient.isHealthy();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("status", "UP");
        result.put("mlService", mlHealthy ? "healthy" : "unavailable");
        result.put("timestamp", LocalDateTime.now().toString());
        return ResponseEntity.ok(result);
    }

    // ── Predict (delegates to Task 1) ──

    @PostMapping("/predict")
    public ResponseEntity<PredictionResult> predict(@Valid @RequestBody PropertyFeatures features) {
        PredictionResult result = mlServiceClient.predict(features);
        return ResponseEntity.ok(result);
    }

    // ── Model Info ──

    @GetMapping("/model-info")
    public ResponseEntity<Map<String, Object>> modelInfo() {
        return ResponseEntity.ok(mlServiceClient.getModelInfo());
    }

    // ── Statistics & Trends ──

    @GetMapping("/statistics")
    public ResponseEntity<MarketStatistics> statistics() {
        return ResponseEntity.ok(marketAnalysisService.getStatistics());
    }

    @GetMapping("/trends")
    public ResponseEntity<TrendResponse> trends() {
        return ResponseEntity.ok(marketAnalysisService.getTrends());
    }

    // ── Comparison ──

    @PostMapping("/compare")
    public ResponseEntity<BatchPredictionResponse> compare(@Valid @RequestBody CompareRequest request) {
        List<PredictionResult> results = mlServiceClient.predictBatch(request.getProperties());
        List<Double> prices = results.stream().map(PredictionResult::getPredictedPrice).toList();
        return ResponseEntity.ok(BatchPredictionResponse.builder()
                .predictions(results)
                .build());
    }

    // ── What-If ──

    @PostMapping("/what-if")
    public ResponseEntity<WhatIfResponse> whatIf(@Valid @RequestBody WhatIfRequest request) {
        PropertyFeatures base = request.getBaseFeatures();
        PredictionResult baseline = mlServiceClient.predict(base);
        PropertyFeatures modified = applyChanges(base, request.getWhatIfChanges());
        PredictionResult modifiedResult = mlServiceClient.predict(modified);

        double pctChange = baseline.getPredictedPrice() != 0
                ? ((modifiedResult.getPredictedPrice() - baseline.getPredictedPrice())
                   / baseline.getPredictedPrice()) * 100.0
                : 0.0;

        return ResponseEntity.ok(WhatIfResponse.builder()
                .baseline(baseline)
                .modified(modifiedResult)
                .changes(request.getWhatIfChanges())
                .percentageChange(Math.round(pctChange * 100.0) / 100.0)
                .build());
    }

    // ── Export ──

    @GetMapping("/export")
    public ResponseEntity<?> export(@RequestParam(defaultValue = "csv") String format) {
        MarketStatistics stats = marketAnalysisService.getStatistics();
        if ("csv".equalsIgnoreCase(format)) return exportCsv(stats);
        if ("pdf".equalsIgnoreCase(format)) return exportPdf(stats);
        return ResponseEntity.badRequest().body(Map.of("error", "Unsupported format: " + format));
    }

    // ── Cache ──

    @DeleteMapping("/cache")
    public ResponseEntity<Map<String, Object>> clearCache() {
        cacheManager.getCacheNames().forEach(name ->
                Objects.requireNonNull(cacheManager.getCache(name)).clear());
        return ResponseEntity.ok(Map.of("status", "cleared", "caches", cacheManager.getCacheNames()));
    }

    // ── Helpers ──

    private PropertyFeatures applyChanges(PropertyFeatures base, Map<String, Double> changes) {
        PropertyFeatures b = PropertyFeatures.builder()
                .squareFootage(base.getSquareFootage())
                .bedrooms(base.getBedrooms())
                .bathrooms(base.getBathrooms())
                .yearBuilt(base.getYearBuilt())
                .lotSize(base.getLotSize())
                .distanceToCityCenter(base.getDistanceToCityCenter())
                .schoolRating(base.getSchoolRating())
                .build();
        changes.forEach((key, value) -> {
            switch (key) {
                case "square_footage" -> b.setSquareFootage(value);
                case "bedrooms" -> b.setBedrooms(value.intValue());
                case "bathrooms" -> b.setBathrooms(value);
                case "year_built" -> b.setYearBuilt(value.intValue());
                case "lot_size" -> b.setLotSize(value);
                case "distance_to_city_center" -> b.setDistanceToCityCenter(value);
                case "school_rating" -> b.setSchoolRating(value);
            }
        });
        return b;
    }

    private ResponseEntity<byte[]> exportCsv(MarketStatistics stats) {
        try {
            StringWriter sw = new StringWriter();
            CSVWriter writer = new CSVWriter(sw);
            writer.writeNext(new String[]{"Metric", "Value"});
            writer.writeNext(new String[]{"Total Properties", String.valueOf(stats.getTotalProperties())});
            writer.writeNext(new String[]{"Avg Price", String.valueOf(stats.getAvgPrice())});
            writer.writeNext(new String[]{"Median Price", String.valueOf(stats.getMedianPrice())});
            writer.writeNext(new String[]{"Min Price", String.valueOf(stats.getMinPrice())});
            writer.writeNext(new String[]{"Max Price", String.valueOf(stats.getMaxPrice())});
            writer.writeNext(new String[]{"Std Dev", String.valueOf(stats.getStdDevPrice())});
            if (stats.getFeatureCorrelations() != null) {
                writer.writeNext(new String[]{""});
                writer.writeNext(new String[]{"Feature", "Correlation"});
                stats.getFeatureCorrelations().forEach((k, v) ->
                        writer.writeNext(new String[]{k, String.valueOf(v)}));
            }
            writer.close();
            byte[] bytes = sw.toString().getBytes();
            HttpHeaders h = new HttpHeaders();
            h.setContentType(MediaType.parseMediaType("text/csv"));
            h.setContentDispositionFormData("attachment",
                    "market_report_" + DateTimeFormatter.ofPattern("yyyyMMdd").format(LocalDateTime.now()) + ".csv");
            return new ResponseEntity<>(bytes, h, HttpStatus.OK);
        } catch (Exception e) {
            log.error("CSV export failed", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    private ResponseEntity<byte[]> exportPdf(MarketStatistics stats) {
        try (PDDocument doc = new PDDocument(); ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PDPage page = new PDPage();
            doc.addPage(page);
            try (PDPageContentStream c = new PDPageContentStream(doc, page)) {
                c.beginText();
                c.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 16);
                c.setLeading(22);
                c.newLineAtOffset(50, 750);
                c.showText("Property Market Analysis Report");
                c.newLine();
                c.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 10);
                c.showText("Generated: " + LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
                c.newLine(); c.newLine();

                c.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 10);
                c.showText("Market Statistics");
                c.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 9);
                c.newLine();
                c.showText("Total Properties: " + stats.getTotalProperties());
                c.newLine();
                c.showText("Average Price: $" + String.format("%,.0f", stats.getAvgPrice()));
                c.newLine();
                c.showText("Median Price: $" + String.format("%,.0f", stats.getMedianPrice()));
                c.newLine();
                c.showText("Std Deviation: $" + String.format("%,.0f", stats.getStdDevPrice()));
                c.newLine(); c.newLine();

                c.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 10);
                c.showText("Feature Correlations");
                c.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 9);
                c.newLine();
                if (stats.getFeatureCorrelations() != null) {
                    stats.getFeatureCorrelations().forEach((k, v) -> {
                        try {
                            c.showText(k + ": " + v);
                            c.newLine();
                        } catch (IOException ignored) {}
                    });
                }
                c.endText();
            }
            doc.save(baos);
            byte[] bytes = baos.toByteArray();
            HttpHeaders h = new HttpHeaders();
            h.setContentType(MediaType.APPLICATION_PDF);
            h.setContentDispositionFormData("attachment",
                    "market_report_" + DateTimeFormatter.ofPattern("yyyyMMdd").format(LocalDateTime.now()) + ".pdf");
            return new ResponseEntity<>(bytes, h, HttpStatus.OK);
        } catch (Exception e) {
            log.error("PDF export failed", e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
