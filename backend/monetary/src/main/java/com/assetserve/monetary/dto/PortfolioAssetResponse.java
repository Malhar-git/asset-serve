package com.assetserve.monetary.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class PortfolioAssetResponse {
    //original assets
    private long id;
    private String symbol;
    private String assetType;
    private String quantity;
    private String assetPrice;

    // new fields
    private BigDecimal currentPrice;
    private BigDecimal totalValue;
    private BigDecimal profitAndLoss;

}
