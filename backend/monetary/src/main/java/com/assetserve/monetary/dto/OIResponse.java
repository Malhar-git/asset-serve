package com.assetserve.monetary.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class OIResponse {
    private double pcr;
    private String tradingSymbol;
}
