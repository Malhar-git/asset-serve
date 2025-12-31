package com.assetserve.monetary.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WatchlistResponse {
    private Long id;
    private String symbolToken;
    private String symbolName;
    private Double ltp; // Current market price
    private Double targetPrice; // User's target buy price
    private String notes;
}
