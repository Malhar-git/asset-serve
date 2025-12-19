package com.assetserve.monetary.service;

import com.assetserve.monetary.dto.HoldingResponse;
import com.assetserve.monetary.dto.ScripPriceData;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.warrenstrange.googleauth.GoogleAuthenticator;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class MarketDataService {
    // Base URL for AngelOne SmartAPI
    private static final String BASE_URL = "https://apiconnect.angelone.in";

    // AngelOne API credentials injected from application.properties
    @Value("${angelone.api.key}")
    private String apiKey;

    @Value("${angelone.client.id}")
    private String clientId;

    @Value("${angelone.client.password}")
    private String clientPassword;

    @Value("${angelone.client.totp}")
    private String totpp;

    // Authentication tokens received from AngelOne API
    private String jwtToken;
    private String refreshToken;
    private String feedToken;

    // Network details for API authentication
    private String clientLocalIP;
    private String clientPublicIP;
    private String macAddress;

    // JSON parser for API responses
    private final ObjectMapper objectMapper;

    // HTTP client for making API calls
    private final RestTemplate restTemplate;

    // Constructor injection for RestTemplate and ObjectMapper
    public MarketDataService(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    // Initialize service by logging into AngelOne after bean creation
    @PostConstruct
    public void init() {
        try {
            System.out.println("--- Attempting to log in to Angel One Smart API via Direct HTTP... ---");

            // Auto-detect network details required for API authentication
            this.clientLocalIP = getLocalIPAddress();
            this.clientPublicIP = getPublicIPAddress();
            this.macAddress = getMacAddress();
            System.out.println("Detected Local IP: " + clientLocalIP);
            System.out.println("Detected Public IP: " + clientPublicIP);
            System.out.println("Detected MAC: " + macAddress);

            // Generate TOTP code for two-factor authentication
            GoogleAuthenticator gAuth = new GoogleAuthenticator();
            int totpCode = gAuth.getTotpPassword(totpp);
            String totp = String.format("%06d", totpCode);

            // Prepare login request with credentials
            String url = BASE_URL + "/rest/auth/angelbroking/user/v1/loginByPassword";
            Map<String, String> requestBody = new HashMap<>();
            requestBody.put("clientcode", clientId);
            requestBody.put("password", clientPassword);
            requestBody.put("totp", totp);

            // Create HTTP headers and request entity
            HttpHeaders headers = createHeaders(false);
            HttpEntity<Map<String, String>> request = new HttpEntity<>(requestBody, headers);

            // Make login API call
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, request, String.class);
            JsonNode root = objectMapper.readTree(response.getBody());

            // Check if login was successful
            if (!root.has("status") || !root.get("status").asBoolean()) {
                throw new RuntimeException("Failed to generate Angel One session. API returned null. Check credentials/TOTP.");
            }

            // Extract and store authentication tokens
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

    // Create HTTP headers for API requests with required authentication parameters
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

        // Add JWT token for authenticated endpoints
        if (requiresAuth && jwtToken != null) {
            headers.set("Authorization", "Bearer " + jwtToken);
        }

        return headers;
    }

    // Fetch Last Traded Price (LTP) for a specific stock
    public double getLtp(String exchange, String tradingSymbol, String symbolToken) {
        // Check if service is initialized
        if (jwtToken == null) {
            System.out.println("AngelOne not initialized! Cannot fetch price");
            return 0.0;
        }

        try {
            // Prepare LTP request payload
            String url = BASE_URL + "/rest/secure/angelbroking/market/v1/quote/";
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("mode", "LTP");
            requestBody.put("exchangeTokens", Map.of(exchange, List.of(symbolToken)));

            // Create request with authentication headers
            HttpHeaders headers = createHeaders(true);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            // Make API call to fetch LTP
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, request, String.class);
            JsonNode root = objectMapper.readTree(response.getBody());

            // Parse LTP from response
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

    // Search for instruments/stocks by name or symbol
    public String searchInstruments(String query) {
        // Check if service is initialized
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

            // Create request with authentication
            HttpHeaders headers = createHeaders(true);
            HttpEntity<Map<String, String>> request = new HttpEntity<>(requestBody, headers);

            // Call search API
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, request, String.class);
            return response.getBody();

        } catch (Exception e) {
            e.printStackTrace();
            return "[]";
        }
    }

    // Fetch historical price data (candlestick data) for charting
    public List<ScripPriceData> getPriceData(String exchange, String symboltoken, String interval, String fromDate, String toDate) {
        // Check if service is initialized
        if (jwtToken == null) {
            System.err.println("Angel One service not initialized! Cannot get price data");
            return new ArrayList<>();
        }

        try {
            // Prepare candle data request with date range and interval
            String url = BASE_URL + "/rest/secure/angelbroking/historical/v1/getCandleData";
            Map<String, String> requestBody = new HashMap<>();
            requestBody.put("exchange", exchange);
            requestBody.put("symboltoken", symboltoken);
            requestBody.put("interval", interval);
            requestBody.put("fromdate", fromDate);
            requestBody.put("todate", toDate);

            // Create authenticated request
            HttpHeaders headers = createHeaders(true);
            HttpEntity<Map<String, String>> request = new HttpEntity<>(requestBody, headers);

            // Make API call
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, request, String.class);

            // Validate response
            if (response.getBody() == null || response.getBody().isEmpty()) {
                System.err.println("Angel one returned null / empty response for candle data");
                return new ArrayList<>();
            }

            // Parse JSON response into ScripPriceData objects
            JsonNode root = objectMapper.readTree(response.getBody());
            List<ScripPriceData> data = new ArrayList<>();

            if (root.has("data") && root.get("status").asBoolean() && !root.get("data").isNull()) {
                JsonNode dataArray = root.get("data");

                // Each candle is an array: [timestamp, open, high, low, close, volume]
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

    // Fetch user's portfolio holdings from AngelOne
    public List<HoldingResponse> getHolding() {
        // Check if service is initialized
        if (jwtToken == null) {
            System.err.println("Angel One service not initialized! Cannot get holding data");
            return new ArrayList<>();
        }

        try {
            // Prepare holdings request (GET request with auth headers)
            String url = BASE_URL + "/rest/secure/angelbroking/portfolio/v1/getHolding";
            HttpHeaders headers = createHeaders(true);
            HttpEntity<String> request = new HttpEntity<>(headers);

            // Make API call to fetch holdings
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, request, String.class);
            JsonNode root = objectMapper.readTree(response.getBody());
            List<HoldingResponse> userHoldings = new ArrayList<>();

            // Parse holdings data if response is successful
            if (root.has("data") && !root.get("data").isNull() && root.get("status").asBoolean()) {
                JsonNode dataObj = root.get("data");

                if (dataObj.has("holdings") && !dataObj.get("holdings").isNull()) {
                    JsonNode holdingArray = dataObj.get("holdings");

                    // Map each holding to HoldingResponse DTO
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

    // Fetch live LTP for major indices using quote API (only LTP)
    public Map<String, Double> getIndicesLTP(){
        if(jwtToken == null) {
            System.err.println("Angel One service not initialized! Cannot get indicesLTP data");
            return new HashMap<>();
        }

        try {
            String url = BASE_URL + "/rest/secure/angelbroking/market/v1/quote/";

            // Index symbol tokens for NSE
            // These are the official tokens for indices
            Map<String, String> indexTokens = new LinkedHashMap<>();
            indexTokens.put("NIFTY 50", "99926000");
            indexTokens.put("NIFTY BANK", "99926009");
            indexTokens.put("SENSEX", "99919000");
            indexTokens.put("NIFTY FIN SERVICE", "99926037");
            indexTokens.put("NIFTY IT", "99926018");
            indexTokens.put("NIFTY PHARMA", "99926024");
            indexTokens.put("NIFTY AUTO", "99926013");

            // Prepare request body - fetch all indices in one API call
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("mode", "LTP");  // Use LTP mode for just the price

            // Create list of all index tokens
            List<String> tokenList = new ArrayList<>(indexTokens.values());
            Map<String, List<String>> exchangeTokens = new HashMap<>();
            exchangeTokens.put("NSE", tokenList);
            requestBody.put("exchangeTokens", exchangeTokens);

            // Create HTTP request with headers
            HttpHeaders headers = createHeaders(true);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            // Make API call
            System.out.println("Fetching indices data from AngelOne...");
            System.out.println("Request URL: " + url);
            System.out.println("Request Body: " + requestBody);

            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    request,
                    String.class
            );

            // Log response status
            System.out.println("Response Status: " + response.getStatusCode());

            // Check if response is HTML (error)
            String responseBody = response.getBody();
            if (responseBody != null && responseBody.trim().startsWith("<html")) {
                System.err.println("Angel One API returned HTML instead of JSON.");
                System.err.println("Response preview: " + responseBody.substring(0, Math.min(500, responseBody.length())));
                return new HashMap<>();
            }

            // Parse JSON response
            JsonNode root = objectMapper.readTree(responseBody);
            System.out.println("Parsed Response: " + root.toString());

            Map<String, Double> indicesMap = new LinkedHashMap<>();

            // Check if API call was successful
            if (root.has("status") && root.get("status").asBoolean()) {
                JsonNode data = root.get("data");

                if (data != null && data.has("fetched")) {
                    JsonNode fetchedArray = data.get("fetched");

                    // Create reverse map: token -> name
                    Map<String, String> tokenToName = new HashMap<>();
                    for (Map.Entry<String, String> entry : indexTokens.entrySet()) {
                        tokenToName.put(entry.getValue(), entry.getKey());
                    }

                    // Parse each index data
                    for (JsonNode item : fetchedArray) {
                        String symbolToken = item.path("symbolToken").asText();
                        double ltp = item.path("ltp").asDouble(0.0);

                        // Map token back to index name
                        String indexName = tokenToName.get(symbolToken);
                        if (indexName != null && ltp > 0) {
                            indicesMap.put(indexName, ltp);
                            System.out.println(indexName + " -> ₹" + ltp);
                        }
                    }

                    System.out.println("Successfully fetched " + indicesMap.size() + " indices");
                }
            } else {
                System.err.println("Angel One API returned error status");
                System.err.println("Error message: " + root.path("message").asText());
            }

            return indicesMap;

        } catch (Exception e) {
            System.err.println("Error fetching indicesLTP: " + e.getMessage());
            e.printStackTrace();
            return new HashMap<>();
        }
    }

    // Fetch live Last Traded Price for all major indices (Nifty, Bank Nifty, etc.)(OHLC)
    public Map<String, Map<String, Object>> getIndicesFullData(){
        if(jwtToken == null) {
            System.err.println("Angel One service not initialized!");
            return new HashMap<>();
        }

        try {
            String url = BASE_URL + "/rest/secure/angelbroking/market/v1/quote/";

            // Index tokens
            Map<String, String> indexTokens = new LinkedHashMap<>();
            indexTokens.put("NIFTY 50", "99926000");
            indexTokens.put("NIFTY BANK", "99926009");
            indexTokens.put("SENSEX", "99919000");
            indexTokens.put("NIFTY FIN SERVICE", "99926037");
            indexTokens.put("NIFTY IT", "99926018");
            indexTokens.put("NIFTY PHARMA", "99926024");
            indexTokens.put("NIFTY AUTO", "99926013");

            // Prepare request with FULL mode
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("mode", "FULL");  // FULL mode for complete data

            List<String> tokenList = new ArrayList<>(indexTokens.values());
            Map<String, List<String>> exchangeTokens = new HashMap<>();
            exchangeTokens.put("NSE", tokenList);
            requestBody.put("exchangeTokens", exchangeTokens);

            HttpHeaders headers = createHeaders(true);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            System.out.println("Fetching full indices data...");
            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    request,
                    String.class
            );

            // Check for HTML response
            String responseBody = response.getBody();
            if (responseBody != null && responseBody.trim().startsWith("<html")) {
                System.err.println("API returned HTML error");
                return new HashMap<>();
            }

            JsonNode root = objectMapper.readTree(responseBody);
            Map<String, Map<String, Object>> indicesData = new LinkedHashMap<>();

            if (root.has("status") && root.get("status").asBoolean()) {
                JsonNode fetchedArray = root.get("data").get("fetched");

                // Create reverse map: token -> name
                Map<String, String> tokenToName = new HashMap<>();
                for (Map.Entry<String, String> entry : indexTokens.entrySet()) {
                    tokenToName.put(entry.getValue(), entry.getKey());
                }

                // Parse each index
                for (JsonNode item : fetchedArray) {
                    String symbolToken = item.path("symbolToken").asText();
                    String indexName = tokenToName.get(symbolToken);

                    if (indexName != null) {
                        Map<String, Object> data = new HashMap<>();
                        data.put("ltp", item.path("ltp").asDouble());
                        data.put("open", item.path("open").asDouble());
                        data.put("high", item.path("high").asDouble());
                        data.put("low", item.path("low").asDouble());
                        data.put("close", item.path("close").asDouble());
                        data.put("change", item.path("change").asDouble());
                        data.put("percentChange", item.path("perChange").asDouble());

                        indicesData.put(indexName, data);
                        System.out.println(indexName + " -> LTP: " + data.get("ltp") + ", Change: " + data.get("percentChange") + "%");
                    }
                }
            } else {
                System.err.println("API error: " + root.path("message").asText());
            }

            return indicesData;

        } catch (Exception e) {
            System.err.println("Error fetching full data: " + e.getMessage());
            e.printStackTrace();
            return new HashMap<>();
        }
    }

    // Parse indices response JSON into a map of index name to LTP
    private Map<String, Double> parseIndicesResponse(String responseBody){ // FIXED: Changed '=' to method declaration
        Map<String, Double> indicesMap = new HashMap<>();

        try{
            // Parse JSON response
            JsonNode root = objectMapper.readTree(responseBody);

            // Check if the response is successful
            if(root.has("status") && root.get("status").asBoolean()){
                JsonNode data = root.get("data");

                // Extract index name and LTP for each index
                if(data != null && data.isArray()){
                    for (JsonNode index : data){
                        String name = index.get("name").asText();
                        double ltp = index.get("ltp").asDouble();
                        indicesMap.put(name, ltp);
                    }
                }
            }

        } catch (Exception e) {
            System.err.println("Error parsing indices response: " + e.getMessage());
        }
        return indicesMap;
    }

    // Auto-detect local IP address of the machine
    private String getLocalIPAddress() {
        try {
            return java.net.InetAddress.getLocalHost().getHostAddress();
        } catch (Exception e) {
            System.err.println("Could not detect local IP, using default");
            return "192.168.1.1";
        }
    }

    // Auto-detect public IP address using external service
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

    // Auto-detect MAC address of the network interface
    private String getMacAddress() {
        try {
            java.net.InetAddress localHost = java.net.InetAddress.getLocalHost();
            java.net.NetworkInterface ni = java.net.NetworkInterface.getByInetAddress(localHost);

            // Check if network interface exists
            if (ni == null || ni.getHardwareAddress() == null) {
                throw new Exception("Hardware address not found");
            }

            // Convert byte array to MAC address string format
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