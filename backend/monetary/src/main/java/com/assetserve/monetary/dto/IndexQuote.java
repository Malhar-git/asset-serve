package com.assetserve.monetary.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class IndexQuote {
    private String name;
    private double ltp;
    private double open;
    private double high;
    private double low;
    private double close;
    private double change;
    private double percentChange;
    private MarketTrend trend;
}
