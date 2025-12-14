package com.assetserve.monetary.controller;

import com.assetserve.monetary.dto.HoldingResponse;
import com.assetserve.monetary.service.MarketDataService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class HoldingController {
    private final MarketDataService marketDataService;

    @GetMapping("/portfolio")
    public ResponseEntity<String> delete() {
        return ResponseEntity.ok("");
    }
    public ResponseEntity<List<HoldingResponse>> getBrokerHoldings(){

        List<HoldingResponse> holdings = marketDataService.getHolding();
        return ResponseEntity.ok(holdings);
    }
}
