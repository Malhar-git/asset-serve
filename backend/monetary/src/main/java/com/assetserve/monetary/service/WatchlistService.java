package com.assetserve.monetary.service;


import com.assetserve.monetary.dto.WatchlistResponse;
import com.assetserve.monetary.dto.WatchlistRequest;
import com.assetserve.monetary.model.User;
import com.assetserve.monetary.model.UserWatchlist;
import com.assetserve.monetary.repository.UserRepository;
import com.assetserve.monetary.repository.UserWatchListRepository;
import jakarta.transaction.Transactional;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WatchlistService {
    private final UserWatchListRepository userWatchListRepository;
    private final UserRepository userRepository;
    private final RestTemplate restTemplate;

    //Get current authenticated user
    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(()-> new RuntimeException("User not found"));
    }
    @Transactional
    public WatchlistResponse addToWatchList(WatchlistRequest  watchlistRequest) {
        User user = getCurrentUser();

        //Check if already exists
        if(userWatchListRepository.existsByUserIdAndSymbolToken(user.getId(), watchlistRequest.getSymbolToken())) {
            throw new RuntimeException("Symbol token already exists in watchlist");
        }

        Double currentLtp = fetchCurrentPrice(watchlistRequest.getSymbolToken());

        UserWatchlist watchList = UserWatchlist.builder()
                .symbolToken(watchlistRequest.getSymbolToken())
                .symbolName(watchlistRequest.getSymbolName())
                .currentLtp(currentLtp)
                .projectedBuyPrice(watchlistRequest.getTargetPrice())
                .notes(watchlistRequest.getNotes())
                .build();

        UserWatchlist saved =  userWatchListRepository.save(watchList);

        return mapToResponse(saved);
    }

    public List<WatchlistResponse> getUserWatchlist() {
        User user = getCurrentUser();
        List<UserWatchlist> watchlists = userWatchListRepository.findByUserId(user.getId());

        // Update current prices for all symbols
        return watchlists.stream()
                .map(w -> {
                    Double currentLTP = fetchCurrentPrice(w.getSymbolToken());
                    w.setCurrentLtp(currentLTP);
                    userWatchListRepository.save(w); // Update LTP in DB
                    return mapToResponse(w);
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public void removeFromWatchlist(String symbolToken) {
        User user = getCurrentUser();
        userWatchListRepository.deleteByUserIdAndSymbolToken(user.getId(), symbolToken);
    }

    @Transactional
    public WatchlistResponse updateWatchlistItem(String symbolToken, WatchlistRequest request) {
        User user = getCurrentUser();

        UserWatchlist watchlist = userWatchListRepository
                .findByUserIdAndSymbolToken(user.getId(), symbolToken)
                .orElseThrow(() -> new RuntimeException("Watchlist item not found"));

        Double targetPrice = request.getTargetPrice();
        if (targetPrice != null) {
            watchlist.setProjectedBuyPrice(request.getTargetPrice());
        }
        if (request.getNotes() != null) {
            watchlist.setNotes(request.getNotes());
        }

        // Update LTP
        Double currentLTP = fetchCurrentPrice(symbolToken);
        watchlist.setCurrentLtp(currentLTP);

        UserWatchlist updated = userWatchListRepository.save(watchlist);
        return mapToResponse(updated);
    }

    /**
     * Fetch current price using the same logic as your search script
     * This should match your existing priceHistory API implementation
     */
    private Double fetchCurrentPrice(String symbolToken) {
        try {
            LocalDate now = LocalDate.now();
            String toDate = now.format(DateTimeFormatter.ofPattern("yyyy-MM-dd")) + " 15:30";

            LocalDate fromDate = now.minusDays(1);
            String fromDateStr = fromDate.format(DateTimeFormatter.ofPattern("yyyy-MM-dd")) + " 09:15";

            // Use your existing priceHistory endpoint
            String url = String.format(
                    "http://localhost:8080/api/priceHistory?exchange=NSE&symboltoken=%s&interval=ONE_MINUTE&fromDate=%s&toDate=%s",
                    symbolToken, fromDateStr, toDate
            );

            // Call your API and extract the latest price
            // Adjust based on your actual API response structure
            var response = restTemplate.getForObject(url, PriceHistoryResponse.class);

            if (response != null && response.getData() != null && !response.getData().isEmpty()) {
                // Get the most recent price (last item in the list)
                var latestData = response.getData().get(response.getData().size() - 1);
                return latestData.getClose(); // or getOpen(), depending on your preference
            }

            throw new RuntimeException("No price data available");

        } catch (Exception e) {
            throw new RuntimeException("Failed to fetch current price: " + e.getMessage());
        }
    }

    private WatchlistResponse mapToResponse(UserWatchlist watchlist) {
        return WatchlistResponse.builder()
                .id(watchlist.getId())
                .symbolToken(watchlist.getSymbolToken())
                .symbolName(watchlist.getSymbolName())
                .ltp(watchlist.getCurrentLtp())
                .targetPrice(watchlist.getProjectedBuyPrice())
                .notes(watchlist.getNotes())
                .build();
    }

    // Inner class for API response (adjust based on your actual response structure)
    @Data
    private static class PriceHistoryResponse {
        private List<PriceData> data;
    }

    @Data
    private static class PriceData {
        private Double open;
        private Double high;
        private Double low;
        private Double close;
    }
}


