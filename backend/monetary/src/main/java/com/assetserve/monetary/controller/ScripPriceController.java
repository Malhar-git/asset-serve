package com.assetserve.monetary.controller;

import com.assetserve.monetary.dto.ScripPriceData;
import com.assetserve.monetary.service.MarketDataService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("api/v1/history")
@RequiredArgsConstructor
public class ScripPriceController {
    private final MarketDataService marketDataService;

    @GetMapping
    public ResponseEntity<List<ScripPriceData>> getScriptPrices(
            @RequestParam("exchange") String exchange,
            @RequestParam("symboltoken") String symboltoken,
            @RequestParam(value = "interval", defaultValue = "ONE_DAY")String interval,
            @RequestParam("fromDate") String fromDate,
            @RequestParam("toDate") String toDate
    ){
        List<ScripPriceData> scripPrices = marketDataService.getPriceData(
                exchange, symboltoken, interval, fromDate, toDate
        );
        return ResponseEntity.ok(scripPrices);
    }
}
