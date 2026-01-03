package com.assetserve.monetary.service;


import com.assetserve.monetary.dto.WatchlistResponse;
import com.assetserve.monetary.dto.WatchlistRequest;
import com.assetserve.monetary.model.User;
import com.assetserve.monetary.model.UserWatchlist;
import com.assetserve.monetary.repository.UserRepository;
import com.assetserve.monetary.repository.UserWatchListRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WatchlistService {
    private final UserWatchListRepository userWatchListRepository;
    private final UserRepository userRepository;
    private final MarketDataService marketDataService;

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
                .user(user)
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
     * Fetch current price using the MarketDataService directly
     */
    private Double fetchCurrentPrice(String symbolToken) {
        try {
            LocalDate now = LocalDate.now();
            String toDate = now.format(DateTimeFormatter.ofPattern("yyyy-MM-dd")) + " 15:30";

            LocalDate fromDate = now.minusDays(1);
            String fromDateStr = fromDate.format(DateTimeFormatter.ofPattern("yyyy-MM-dd")) + " 09:15";

            // Call the MarketDataService directly instead of making HTTP request
            var priceData = marketDataService.getPriceData(
                    "NSE",
                    symbolToken,
                    "ONE_MINUTE",
                    fromDateStr,
                    toDate
            );

            if (priceData != null && !priceData.isEmpty()) {
                // Get the most recent price (last item in the list)
                var latestData = priceData.get(priceData.size() - 1);
                return latestData.getClose();
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
}


