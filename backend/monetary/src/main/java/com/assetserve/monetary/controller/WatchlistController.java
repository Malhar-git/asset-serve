package com.assetserve.monetary.controller;

import com.assetserve.monetary.dto.WatchlistRequest;
import com.assetserve.monetary.dto.WatchlistResponse;
import com.assetserve.monetary.service.WatchlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/watchlist")
@RequiredArgsConstructor
public class WatchlistController {

    private final WatchlistService watchlistService;

    @GetMapping
    public ResponseEntity<List<WatchlistResponse>> getWatchlist() {
        return ResponseEntity.ok(watchlistService.getUserWatchlist());
    }

    @PostMapping
    public ResponseEntity<WatchlistResponse> addToWatchlist(@RequestBody WatchlistRequest request) {
        return ResponseEntity.ok(watchlistService.addToWatchList(request));
    }

    @PutMapping("/{symbolToken}")
    public ResponseEntity<WatchlistResponse> updateWatchlist(
            @PathVariable String symbolToken,
            @RequestBody WatchlistRequest request) {
        return ResponseEntity.ok(watchlistService.updateWatchlistItem(symbolToken, request));
    }

    @DeleteMapping("/{symbolToken}")
    public ResponseEntity<Void> removeFromWatchlist(@PathVariable String symbolToken) {
        watchlistService.removeFromWatchlist(symbolToken);
        return ResponseEntity.noContent().build();
    }
}