package com.assetserve.monetary.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScripPriceData {
    private String timestamp;
    private double open;
    private double high;
    private double low;
    private double close;
    private long volume;
}