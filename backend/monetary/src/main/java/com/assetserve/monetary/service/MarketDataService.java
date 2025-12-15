package com.assetserve.monetary.service;

import com.assetserve.monetary.dto.HoldingResponse;
import com.assetserve.monetary.dto.ScripPriceData;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.warrenstrange.googleauth.GoogleAuthenticator;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class MarketDataService {
    // Main HTTP API implementation fetch point
    private static final String BASE_URL = "https://apiconnect.angelone.in";

    @Value("${angelone.api.key}")
    private String apiKey;

    @Value("${angelone.client.id}")
    private String clientId;

    @Value("${angelone.client.password}")
    private String clientPassword;

    @Value("${angelone.client.totp}")
    private String totpp;

    private String jwtToken;
    private String refreshToken;
    private String feedToken;

    private String clientLocalIP;
    private String clientPublicIP;
    private String macAddress;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public MarketDataService() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    @PostConstruct
    public void init() {
        try {
            System.out.println("--- Attempting to log in to Angel One Smart API via Direct HTTP... ---");

            // Auto-detect network details
            this.clientLocalIP = getLocalIPAddress();
            this.clientPublicIP = getPublicIPAddress();
            this.macAddress = getMacAddress();
            System.out.println("Detected Local IP: " + clientLocalIP);
            System.out.println("Detected Public IP: " + clientPublicIP);
            System.out.println("Detected MAC: " + macAddress);

            // Generate TOTP code
            GoogleAuthenticator gAuth = new GoogleAuthenticator();
            int totpCode = gAuth.getTotpPassword(totpp);
            String totp = String.format("%06d", totpCode);

            // Prepare login request
            String url = BASE_URL + "/rest/auth/angelbroking/user/v1/loginByPassword";
            Map<String, String> requestBody = new HashMap<>();
            requestBody.put("clientcode", clientId);
            requestBody.put("password", clientPassword);
            requestBody.put("totp", totp);

            HttpHeaders headers = createHeaders(false);
            HttpEntity<Map<String, String>> request = new HttpEntity<>(requestBody, headers);

            // Make login request
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, request, String.class);
            JsonNode root = objectMapper.readTree(response.getBody());

            // Check if the login failed
            if (!root.has("status") || !root.get("status").asBoolean()) {
                throw new RuntimeException("Failed to generate Angel One session. API returned null. Check credentials/TOTP.");
            }

            // Store tokens
            JsonNode data = root.get("data");
            this.jwtToken = data.get("jwtToken").asText();
            this.refreshToken = data.get("refreshToken").asText();
            this.feedToken = data.get("feedToken").asText();

            System.out.println("Angel One Login Success!");

        } catch (Exception e) {
            System.err.println("--- FAILED TO LOGIN TO ANGEL ONE ---");
            e.printStackTrace();
        }
    }

    // Create HTTP headers for API requests
    private HttpHeaders createHeaders(boolean requiresAuth) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Accept", "application/json");
        headers.set("X-UserType", "USER");
        headers.set("X-SourceID", "WEB");
        headers.set("X-ClientLocalIP", clientLocalIP);
        headers.set("X-ClientPublicIP", clientPublicIP);
        headers.set("X-MACAddress", macAddress);
        headers.set("X-PrivateKey", apiKey);

        if (requiresAuth && jwtToken != null) {
            headers.set("Authorization", "Bearer " + jwtToken);
        }

        return headers;
    }

    public double getLtp(String exchange, String tradingSymbol, String symbolToken) {
        if (jwtToken == null) {
            System.out.println("AngelOne not initialized! Cannot fetch price");
            return 0.0;
        }

        try {
            // Prepare LTP request
            String url = BASE_URL + "/rest/secure/angelbroking/market/v1/quote/";
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("mode", "LTP");
            requestBody.put("exchangeTokens", Map.of(exchange, List.of(symbolToken)));

            HttpHeaders headers = createHeaders(true);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            // Make API call
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, request, String.class);
            JsonNode root = objectMapper.readTree(response.getBody());

            // Parse the JSON to get the price
            if (root.has("data") && root.get("data").has("fetched")) {
                JsonNode fetched = root.get("data").get("fetched").get(0);
                if (fetched.has("ltp")) {
                    return fetched.get("ltp").asDouble();
                }
            }

            System.err.println("Could not parse LTP from response: " + root.toString());
            return 0.0;

        } catch (Exception e) {
            e.printStackTrace();
            return 0.0;
        }
    }

    public String searchInstruments(String query) {
        if (jwtToken == null) {
            System.err.println("Angel One service not initialized! Cannot search.");
            return "[]";
        }

        try {
            // Prepare search request
            String url = BASE_URL + "/rest/secure/angelbroking/order/v1/searchScrip";
            Map<String, String> requestBody = new HashMap<>();
            requestBody.put("exchange", "NSE");
            requestBody.put("searchscrip", query);

            HttpHeaders headers = createHeaders(true);
            HttpEntity<Map<String, String>> request = new HttpEntity<>(requestBody, headers);

            // Call the API
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, request, String.class);
            return response.getBody();

        } catch (Exception e) {
            e.printStackTrace();
            return "[]";
        }
    }

    public List<ScripPriceData> getPriceData(String exchange, String symboltoken, String interval, String fromDate, String toDate) {
        if (jwtToken == null) {
            System.err.println("Angel One service not initialized! Cannot get price data");
            return new ArrayList<>();
        }

        try {
            // Prepare candle data request
            String url = BASE_URL + "/rest/secure/angelbroking/historical/v1/getCandleData";
            Map<String, String> requestBody = new HashMap<>();
            requestBody.put("exchange", exchange);
            requestBody.put("symboltoken", symboltoken);
            requestBody.put("interval", interval);
            requestBody.put("fromdate", fromDate);
            requestBody.put("todate", toDate);

            HttpHeaders headers = createHeaders(true);
            HttpEntity<Map<String, String>> request = new HttpEntity<>(requestBody, headers);

            // Make API call
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, request, String.class);

            if (response.getBody() == null || response.getBody().isEmpty()) {
                System.err.println("Angel one returned null / empty response for candle data");
                return new ArrayList<>();
            }

            // Parse JSON response
            JsonNode root = objectMapper.readTree(response.getBody());
            List<ScripPriceData> data = new ArrayList<>();

            if (root.has("data") && root.get("status").asBoolean() && !root.get("data").isNull()) {
                JsonNode dataArray = root.get("data");

                for (JsonNode candle : dataArray) {
                    ScripPriceData dto = ScripPriceData.builder()
                            .timestamp(candle.get(0).asText())
                            .open(candle.get(1).asDouble())
                            .high(candle.get(2).asDouble())
                            .low(candle.get(3).asDouble())
                            .close(candle.get(4).asDouble())
                            .volume(candle.get(5).asLong())
                            .build();
                    data.add(dto);
                }
            } else {
                System.err.println("Angel one API returned error status or null data: " + root.toString());
            }

            return data;

        } catch (Exception e) {
            System.err.println("Angel One service error: ");
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    // GET Holdings(Portfolio)
    public List<HoldingResponse> getHolding() {
        if (jwtToken == null) {
            System.err.println("Angel One service not initialized! Cannot get holding data");
            return new ArrayList<>();
        }

        try {
            // Prepare holdings request
            String url = BASE_URL + "/rest/secure/angelbroking/portfolio/v1/getHolding";
            HttpHeaders headers = createHeaders(true);
            HttpEntity<String> request = new HttpEntity<>(headers);

            // Make API call
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, request, String.class);
            JsonNode root = objectMapper.readTree(response.getBody());
            List<HoldingResponse> userHoldings = new ArrayList<>();

            if (root.has("data") && !root.get("data").isNull() && root.get("status").asBoolean()) {
                JsonNode dataObj = root.get("data");

                if (dataObj.has("holdings") && !dataObj.get("holdings").isNull()) {
                    JsonNode holdingArray = dataObj.get("holdings");

                    for (JsonNode rawHolding : holdingArray) {
                        HoldingResponse dto = HoldingResponse.builder()
                                .tradingSymbol(rawHolding.path("tradingsymbol").asText())
                                .symbolToken(rawHolding.path("symboltoken").asText())
                                .quantity(rawHolding.path("quantity").asInt())
                                .averagePrice(rawHolding.path("averageprice").asDouble(0.0))
                                .LTP(rawHolding.path("ltp").asDouble(0.0))
                                .PnL(rawHolding.path("profitandloss").asDouble(0.0))
                                .profitPercentage(rawHolding.path("pnlpercentage").asDouble(0.0))
                                .build();

                        userHoldings.add(dto);
                    }
                }
            }

            return userHoldings;

        } catch (Exception e) {
            System.err.println("Error fetching holdings: " + e.getMessage());
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    // Auto-detect local IP address
    private String getLocalIPAddress() {
        try {
            return java.net.InetAddress.getLocalHost().getHostAddress();
        } catch (Exception e) {
            System.err.println("Could not detect local IP, using default");
            return "192.168.1.1";
        }
    }

    // Auto-detect public IP address
    private String getPublicIPAddress() {
        try {
            java.net.URL url = new java.net.URL("https://api.ipify.org");
            java.io.BufferedReader in = new java.io.BufferedReader(
                    new java.io.InputStreamReader(url.openStream())
            );
            String ip = in.readLine();
            in.close();
            return ip;
        } catch (Exception e) {
            System.err.println("Could not detect public IP, using default");
            return "106.51.68.11";
        }
    }

    // Auto-detect MAC address
    private String getMacAddress() {
        try {
            java.net.InetAddress localHost = java.net.InetAddress.getLocalHost();
            java.net.NetworkInterface ni = java.net.NetworkInterface.getByInetAddress(localHost);

            if (ni == null || ni.getHardwareAddress() == null) {
                throw new Exception("Hardware address not found");
            }

            byte[] hardwareAddress = ni.getHardwareAddress();
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < hardwareAddress.length; i++) {
                sb.append(String.format("%02X%s", hardwareAddress[i],
                        (i < hardwareAddress.length - 1) ? ":" : ""));
            }
            return sb.toString().toLowerCase();
        } catch (Exception e) {
            System.err.println("Could not detect MAC address, using default");
            return "fe:80:ab:cd:ef:gh";
        }
    }
}