package com.assetserve.monetary.service;

import com.angelbroking.smartapi.SmartConnect;
import com.angelbroking.smartapi.http.SessionExpiryHook;
import com.angelbroking.smartapi.http.exceptions.SmartAPIException;
import com.angelbroking.smartapi.models.User;
import com.assetserve.monetary.dto.ScripPriceData;
import com.warrenstrange.googleauth.GoogleAuthenticator;
import jakarta.annotation.PostConstruct;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class MarketDataService {
    @Value("${angelone.api.key}")
    private String apiKey;

    @Value("${angelone.client.id}")
    private String clientId;

    @Value("${angelone.client.password}")
    private String clientPassword;

    @Value("${angelone.client.totp}")
    private String totpp;

    private SmartConnect smartConnect;

    @PostConstruct
    public void init() {
        try {
            System.out.println("--- Attempting to log in to Angel One Smart API v2.2.6... ---");

            smartConnect = new SmartConnect();
            smartConnect.setApiKey(apiKey);

            smartConnect.setSessionExpiryHook(new SessionExpiryHook() {
                @Override
                public void sessionExpired() {
                    System.out.println("Angel One session expired!");
                }
            });

            GoogleAuthenticator gAuth = new GoogleAuthenticator();
            int totpCode = gAuth.getTotpPassword(totpp);
            String totp = String.format("%06d",totpCode);

            // Make sure you are using the 3-argument version:
            User user = smartConnect.generateSession(clientId, clientPassword, totp);

            // Check if the login failed *before* trying to use the user object
            if (user == null || user.getAccessToken() == null) {
                // This stops the app from crashing with a NullPointerException
                throw new RuntimeException("Failed to generate Angel One session. API returned null. Check credentials/TOTP.");
            }

            // This code will only run if the login was successful
            smartConnect.setAccessToken(user.getAccessToken());
            smartConnect.setUserId(user.getUserId());

            System.out.println("Angel One Login Success! User: " + user.getUserName());

        } catch (Exception e) {
            System.err.println("--- FAILED TO LOGIN TO ANGEL ONE ---");
            // This will now catch the "Failed to generate... session" error too
            e.printStackTrace();
        }
    }

    public double getLtp(String exchange, String tradingSymbol, String symbolToken){
        if(smartConnect == null){
            System.out.println("AngelOne not initialized! Cannot fetch price");
            return 0.0;
        }
        try{
            JSONObject ltpData = smartConnect.getLTP(exchange, tradingSymbol, symbolToken);

            // Parse the JSON to get the price
            if (ltpData.has("data") && ltpData.getJSONObject("data").has("ltp")) {
                return ltpData.getJSONObject("data").getDouble("ltp");
            } else if (ltpData.has("ltp")) {
                return ltpData.getDouble("ltp");
            } else {
                System.err.println("Could not parse LTP from response: " + ltpData.toString());
                return 0.0;
            }
        } catch (Exception e) {
            e.printStackTrace();
            return 0.0;
        }
    }

    public String searchInstruments(String query) {
        if (smartConnect == null) {
            System.err.println("Angel One service not initialized! Cannot search.");
            return "[]"; // Return an empty JSON array
        }

        try {
            // This is the payload from the Angel One docs
            JSONObject payload = new JSONObject();
            payload.put("exchange", "NSE"); // Let's default to searching NSE
            payload.put("searchscrip", query); // The user's search term

            // Call the API
            String jsonResponse = smartConnect.getSearchScrip(payload);

            return jsonResponse;

        } catch (Exception e) {
            e.printStackTrace();
            return "[]"; // Return an empty JSON array on error
        } catch (SmartAPIException e) {
            throw new RuntimeException(e);
        }
    }

    public List<ScripPriceData> getPriceData(String exchange, String symboltoken, String interval, String fromDate, String toDate) {
        if (smartConnect == null) {
            System.err.println("Angel One service not initialized! Cannot get price data");
            return new ArrayList<>();
        }
        try{
            JSONObject payload = new JSONObject();
            payload.put("exchange", exchange);
            payload.put("symboltoken", symboltoken);
            payload.put("interval", interval);
            payload.put("fromdate", fromDate );
            payload.put("todate", toDate);

            String response;
            try {
                response = smartConnect.candleData(payload);
            } catch (Exception e) {
                System.err.println("SmartAPI Exception during candleData call: " + e.getMessage());
                return new ArrayList<>();
            }

            if(response == null || response.isEmpty()){
                System.err.println("Angel one returned null / empty response for candle data");
                return new ArrayList<>();
            }
            JSONObject jsonResponse = new JSONObject(response);
            List<ScripPriceData> data = new ArrayList<>();

            if(jsonResponse.has("data") && jsonResponse.getBoolean("status") && !jsonResponse.isNull("data")){
                JSONArray dataArray = jsonResponse.getJSONArray("data");
                for (int i = 0; i < dataArray.length(); i++) {
                    JSONArray candle = dataArray.getJSONArray(i);

                    ScripPriceData dto = ScripPriceData.builder()
                            .timestamp(candle.getString(0))
                            .open(candle.getDouble(1))
                            .high(candle.getDouble(2))
                            .low(candle.getDouble(3))
                            .close(candle.getDouble(4))
                            .volume(candle.getLong(5))
                            .build();

                    data.add(dto);
                }
            }else {
                System.err.println("Angel one API returned error status or null data: " + jsonResponse.toString());

            }
            return data;
        }catch (Exception e) {
            System.err.println("Angel One service error: " );
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

}

