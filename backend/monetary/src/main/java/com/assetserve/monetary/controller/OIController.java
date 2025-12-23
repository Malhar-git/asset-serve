package com.assetserve.monetary.controller;

import com.assetserve.monetary.dto.OIResponse;
import com.assetserve.monetary.service.MarketDataService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class OIController {
    private final MarketDataService marketDataService;

    @GetMapping("/pcr")
    public ResponseEntity<List<OIResponse>> getOIResponse()
    {
        List<OIResponse> oiResponse = marketDataService.getOIResponse();
        return ResponseEntity.ok(oiResponse);
    }
}
