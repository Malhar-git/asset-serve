package com.assetserve.monetary.controller;

import com.assetserve.monetary.service.MarketDataService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/search")
@RequiredArgsConstructor
public class SearchController {
    private final MarketDataService marketDataService;

    @GetMapping
    public ResponseEntity<String> search(@RequestParam("query") String query) {

        String result = marketDataService.searchInstruments(query);
        return ResponseEntity.ok(result);
    }
}
