package com.assetserve.monetary.service;

import com.angelbroking.smartapi.SmartConnect;
import com.angelbroking.smartapi.http.SessionExpiryHook;
import com.angelbroking.smartapi.http.exceptions.SmartAPIException;
import com.angelbroking.smartapi.models.User;
import com.warrenstrange.googleauth.GoogleAuthenticator;
import jakarta.annotation.PostConstruct;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

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

}

