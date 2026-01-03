package com.assetserve.monetary.controller;

import com.assetserve.monetary.dto.IndexQuote;
import com.assetserve.monetary.service.MarketDataService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/market")
public class IndicesPriceController {
    @Autowired
    private MarketDataService marketDataService;

    // EndPoint to fetch live indices ltp
    @GetMapping("/indices")
    public ResponseEntity<Map<String, Double>> getIndicesLTP() {
        try {
            Map<String, Double> indices = marketDataService.getIndicesLTP();

            if (indices.isEmpty()) {
                return ResponseEntity.noContent().build();
            }

            return ResponseEntity.ok(indices);

        } catch (Exception e) {
            System.err.println("Error in controller: " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    // Full data endpoint with OHLC
    @GetMapping("/indices/full")
    public ResponseEntity<Map<String, IndexQuote>> getIndicesFullData() {
        try {
            Map<String, IndexQuote> data = marketDataService.getIndicesFullData();

            if (data.isEmpty()) {
                return ResponseEntity.noContent().build();
            }

            return ResponseEntity.ok(data);

        } catch (Exception e) {
            System.err.println("Error: " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}
