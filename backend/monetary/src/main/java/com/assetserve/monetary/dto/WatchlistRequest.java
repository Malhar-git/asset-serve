package com.assetserve.monetary.dto;

import lombok.Data;

@Data
public class WatchlistRequest {
    private String symbolToken;
    private String symbolName;
    private double targetPrice;
    private String notes;
}
