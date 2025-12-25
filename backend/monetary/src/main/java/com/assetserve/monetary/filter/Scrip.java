package com.assetserve.monetary.filter;

public class Scrip {
    private String token;
    private String symbol; // e.g., "RELIANCE-EQ"
    private String name;   // e.g., "RELIANCE" (Clean version for display)

    public Scrip(String token, String symbol) {
        this.token = token;
        this.symbol = symbol;
        // Automatically create a pretty name by removing "-EQ"
        this.name = symbol.replace("-EQ", "");
    }

    // Getters
    public String getToken() { return token; }
    public String getSymbol() { return symbol; }
    public String getName() { return name; }
}