package com.assetserve.monetary.dto;

public enum MarketTrend {
    UP,
    DOWN,
    NEUTRAL;

    private static final double EPSILON = 0.0001d;

    public static MarketTrend fromChange(double change) {
        if (Double.isNaN(change)) {
            return NEUTRAL;
        }

        if (change > EPSILON) {
            return UP;
        }

        if (change < -EPSILON) {
            return DOWN;
        }

        return NEUTRAL;
    }
}
