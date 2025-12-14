package com.assetserve.monetary.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class HoldingResponse {
    private String tradingSymbol;
    private String symbolToken;
    private int quantity;
    private double averagePrice;
    private double LTP;
    private double PnL;
    private double profitPercentage;
}
