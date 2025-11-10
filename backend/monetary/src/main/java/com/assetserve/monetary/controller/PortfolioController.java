package com.assetserve.monetary.controller;

import com.assetserve.monetary.dto.AddAssetRequest;
import com.assetserve.monetary.model.Asset;
import com.assetserve.monetary.service.PortfolioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/portfolio")
@RequiredArgsConstructor
public class PortfolioController {

    private final PortfolioService portfolioService;

    // This is our "locked" test endpoint
    @GetMapping("/hello")
    public ResponseEntity<String> sayHello() {
        return ResponseEntity.ok("Hello from a PROTECTED endpoint!");
    }

    // --- 4. THIS IS OUR NEW ENDPOINT ---
    @PostMapping("/assets")
    public ResponseEntity<Asset> addAsset(
            @Valid @RequestBody AddAssetRequest request,
            Authentication authentication // <-- 5. Spring Security gives us this!
    ) {
        // 6. Get the user's email (the "name") from the token
        String userEmail = authentication.getName();

        // 7. Call the service to create the asset
        Asset savedAsset = portfolioService.addAsset(request, userEmail);

        // 8. Return a "201 Created" status with the new asset
        return ResponseEntity.status(HttpStatus.CREATED).body(savedAsset);
    }

    @GetMapping
    public ResponseEntity <List<Asset>> getPortfolio(Authentication authentication) {
        //Get the user's email from their token
        String userEmail = authentication.getName();
        //Call our new service method
        List<Asset> portfolio = portfolioService.getPortfolio(userEmail);
        //Return the list with a 200 OK status
        return ResponseEntity.ok(portfolio);
    }
}