package com.assetserve.monetary.service;

import com.assetserve.monetary.dto.HoldingResponse;
import com.assetserve.monetary.dto.IndexQuote;
import com.assetserve.monetary.dto.MarketTrend;
import com.assetserve.monetary.dto.OIResponse;
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

    private static final Map<String, String> INDEX_TOKENS;

    static {
        Map<String, String> tokens = new LinkedHashMap<>();
        tokens.put("NIFTY 50", "99926000");
        tokens.put("NIFTY BANK", "99926009");
        INDEX_TOKENS = Collections.unmodifiableMap(tokens);
    }

    private HttpEntity<Map<String, Object>> buildIndexQuoteRequest(String mode) {
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("mode", mode);

        Map<String, List<String>> exchangeTokens = new HashMap<>();
        exchangeTokens.put("NSE", new ArrayList<>(INDEX_TOKENS.values()));
        requestBody.put("exchangeTokens", exchangeTokens);

        HttpHeaders headers = createHeaders(true);
        return new HttpEntity<>(requestBody, headers);
    }

    private double readNumericValue(JsonNode node, String fieldName) {
        JsonNode valueNode = node.get(fieldName);
        if (valueNode == null || !valueNode.isNumber()) {
            return Double.NaN;
        }
        return valueNode.asDouble();
    }

    private double sanitizeNumeric(double value) {
        if (Double.isFinite(value)) {
            return value;
        }
        return 0.0d;
    }

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
            String url = BASE_URL + "/rest/secure/angelbroking/portfolio/v1/getAllHolding";
            HttpHeaders headers = createHeaders(true);
            HttpEntity<String> request = new HttpEntity<>(headers);

            // Make API call to fetch holdings
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, request, String.class);

            // Log the full response for debugging
            System.out.println("=== AngelOne Holdings API Response ===");
            System.out.println("Status Code: " + response.getStatusCode());
            System.out.println("Response Body: " + response.getBody());
            System.out.println("=====================================");

            JsonNode root = objectMapper.readTree(response.getBody());
            List<HoldingResponse> userHoldings = new ArrayList<>();

            // Parse holdings data if response is successful
            if (root.has("data") && !root.get("data").isNull() && root.get("status").asBoolean()) {
                JsonNode dataObj = root.get("data");

                System.out.println("Data object structure: " + dataObj.toString());

                if (dataObj.has("holdings") && !dataObj.get("holdings").isNull()) {
                    JsonNode holdingArray = dataObj.get("holdings");
                    System.out.println("Holdings array found with " + holdingArray.size() + " items");

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
                } else {
                    System.err.println("No 'holdings' field found in data object!");
                    System.err.println("Available fields in data: " + dataObj.fieldNames());
                }
            } else {
                System.err.println("API returned error status or null data");
                System.err.println("Status: " + (root.has("status") ? root.get("status").asBoolean() : "missing"));
                System.err.println("Message: " + root.path("message").asText("no message"));
            }

            return userHoldings;

        } catch (Exception e) {
            System.err.println("Error fetching holdings: " + e.getMessage());
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    // Fetch live LTP for major indices using quote API (only LTP)
    public Map<String, Double> getIndicesLTP() {
        Map<String, IndexQuote> fullData = getIndicesFullData();
        Map<String, Double> indicesMap = new LinkedHashMap<>();
        fullData.forEach((name, quote) -> indicesMap.put(name, quote.getLtp()));
        return indicesMap;
    }

    // Fetch live Last Traded Price for all major indices (Nifty, Bank Nifty, etc.)(OHLC)
    public Map<String, IndexQuote> getIndicesFullData() {
        if (jwtToken == null) {
            System.err.println("Angel One service not initialized!");
            return new LinkedHashMap<>();
        }

        try {
            String url = BASE_URL + "/rest/secure/angelbroking/market/v1/quote/";
            HttpEntity<Map<String, Object>> request = buildIndexQuoteRequest("FULL");

            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    request,
                    String.class
            );

            String responseBody = response.getBody();
            if (responseBody == null) {
                return new LinkedHashMap<>();
            }

            if (responseBody.trim().startsWith("<html")) {
                System.err.println("API returned HTML error while fetching indices data");
                return new LinkedHashMap<>();
            }

            JsonNode root = objectMapper.readTree(responseBody);
            if (!root.path("status").asBoolean(false)) {
                System.err.println("API error: " + root.path("message").asText("Unknown error"));
                return new LinkedHashMap<>();
            }

            JsonNode fetchedArray = root.path("data").path("fetched");
            if (!fetchedArray.isArray()) {
                return new LinkedHashMap<>();
            }

            Map<String, String> tokenToName = new HashMap<>();
            INDEX_TOKENS.forEach((name, token) -> tokenToName.put(token, name));

            Map<String, IndexQuote> indicesData = new LinkedHashMap<>();

            for (JsonNode item : fetchedArray) {
                String symbolToken = item.path("symbolToken").asText();
                String indexName = tokenToName.get(symbolToken);
                if (indexName == null) {
                    continue;
                }

                double ltp = readNumericValue(item, "ltp");
                double open = readNumericValue(item, "open");
                double high = readNumericValue(item, "high");
                double low = readNumericValue(item, "low");
                double close = readNumericValue(item, "close");
                double change = readNumericValue(item, "change");
                double percentChange = readNumericValue(item, "perChange");

                if (!Double.isFinite(change) && Double.isFinite(ltp) && Double.isFinite(close)) {
                    change = ltp - close;
                }

                if (!Double.isFinite(percentChange) && Double.isFinite(change) && Double.isFinite(close) && Math.abs(close) > 0.0001d) {
                    percentChange = (change / close) * 100d;
                }

                double sanitizedChange = sanitizeNumeric(change);
                double sanitizedPercentChange = sanitizeNumeric(percentChange);

                IndexQuote quote = IndexQuote.builder()
                        .name(indexName)
                        .ltp(sanitizeNumeric(ltp))
                        .open(sanitizeNumeric(open))
                        .high(sanitizeNumeric(high))
                        .low(sanitizeNumeric(low))
                        .close(sanitizeNumeric(close))
                        .change(sanitizedChange)
                        .percentChange(sanitizedPercentChange)
                        .trend(MarketTrend.fromChange(sanitizedChange))
                        .build();

                indicesData.put(indexName, quote);
            }

            return indicesData;

        } catch (Exception e) {
            System.err.println("Error fetching full data: " + e.getMessage());
            e.printStackTrace();
            return new LinkedHashMap<>();
        }
    }

    public List<OIResponse> getOIResponse(){
        if(jwtToken == null) {
            System.err.println("Angel One API returned error status");
            return new ArrayList<>();
        }
        try{
            String URL = BASE_URL + "/rest/secure/angelbroking/marketData/v1/putCallRatio";
            HttpHeaders headers = createHeaders(true);

            // Create HTTP entity with headers only (GET request - no body)
            HttpEntity<Void> request = new HttpEntity<>(headers);

            //Make API call to fetch PCR data
            ResponseEntity<String> response = restTemplate.exchange(URL, HttpMethod.GET, request, String.class);
            String responseBody = response.getBody();

            // Log response for debugging
            System.out.println("=== PCR/OI API Response ===");
            System.out.println("Status: " + response.getStatusCode());

            JsonNode root = objectMapper.readTree(responseBody);
            List<OIResponse> oiResponse = new ArrayList<>();

            if(root.has("data") && !root.get("data").isNull() && root.get("status").asBoolean()) {
                JsonNode dataArray = root.get("data");
                System.out.println("Data is array: " + dataArray.isArray());
                System.out.println("Data array size: " + (dataArray.isArray() ? dataArray.size() : "N/A"));

                if(dataArray.isArray()) {
                    for(JsonNode item : dataArray) {
                        OIResponse DTO = OIResponse.builder()
                                .pcr(item.has("pcr") ? item.get("pcr").asDouble() : 0.0)
                                .tradingSymbol(item.has("tradingSymbol") ? item.get("tradingSymbol").asText() : "")
                                .build();
                        oiResponse.add(DTO);
                        System.out.println("Added PCR: " + DTO.getPcr() + " for " + DTO.getTradingSymbol());
                    }
                }
            } else {
                System.err.println("PCR API returned error or invalid data structure");
                System.err.println("Has data: " + root.has("data"));
                System.err.println("Status: " + (root.has("status") ? root.get("status").asBoolean() : "missing"));
            }

            System.out.println("Returning " + oiResponse.size() + " PCR entries");
            return oiResponse;
        } catch (Exception e) {
            System.err.println("Error fetching OI Response: " + e.getMessage());
            e.printStackTrace();
            return new ArrayList<>();
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