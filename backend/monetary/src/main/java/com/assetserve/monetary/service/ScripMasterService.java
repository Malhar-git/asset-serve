package com.assetserve.monetary.service;

import com.assetserve.monetary.filter.Scrip;
import org.springframework.stereotype.Service;
import jakarta.annotation.PostConstruct; // Use javax.annotation for older Spring

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ScripMasterService {

    private List<Scrip> nseScripCache = new ArrayList<>();

    @PostConstruct
    public void init() {
        loadScripsFromTextFile();
    }

    private void loadScripsFromTextFile() {
        try {
            // Read the file from src/main/resources/nse_scrips.txt
            InputStream inputStream = getClass().getClassLoader().getResourceAsStream("nse_scrips.txt");

            if (inputStream == null) {
                System.err.println("File not found! Make sure nse_scrips.txt is in src/main/resources");
                return;
            }

            BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8));
            List<Scrip> tempBuffer = new ArrayList<>();
            String line;

            while ((line = reader.readLine()) != null) {
                // Parse logic: "16921 20MICRONS-EQ"
                // Split by space
                String[] parts = line.trim().split("\\s+"); // \\s+ handles single or multiple spaces

                if (parts.length >= 2) {
                    String token = parts[0];
                    String symbol = parts[1];

                    tempBuffer.add(new Scrip(token, symbol));
                }
            }

            this.nseScripCache = tempBuffer;
            System.out.println("Loaded " + nseScripCache.size() + " scrips successfully.");

        } catch (Exception e) {
            System.err.println("Error loading scrips: " + e.getMessage());
        }
    }

    // Search function remains the same
    public List<Scrip> searchScrips(String query) {
        if (query == null || query.length() < 2) return List.of();

        String q = query.toUpperCase();

        return nseScripCache.stream()
                .filter(s -> s.getName().contains(q)) // Search by clean name
                .limit(10)
                .collect(Collectors.toList());
    }
}