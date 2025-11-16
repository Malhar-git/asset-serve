package com.assetserve.monetary.controller;

import com.assetserve.monetary.dto.AddAssetRequest;
import com.assetserve.monetary.dto.PortfolioAssetResponse;
import com.assetserve.monetary.model.Asset;
import com.assetserve.monetary.service.PortfolioService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.nio.file.AccessDeniedException;
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
    public ResponseEntity<List<PortfolioAssetResponse>> getPortfolio(Authentication authentication) {

        String userEmail = authentication.getName();

        // This line is the same, but it now calls our NEW "smart" service method
        List<PortfolioAssetResponse> portfolio = portfolioService.getPortfolio(userEmail);

        return ResponseEntity.ok(portfolio);
    }
    @DeleteMapping("/assets/{id}")
    public ResponseEntity<Void> deleteAsset(
            /*
            The @PathVariable("id") annotation is what grabs the 5 from a URL
             like /api/v1/assets/5 and passes it into the assetId variable
             */
            @PathVariable("id") Long assetId,
            Authentication authentication
    ){
        String userEmail = authentication.getName();

        try{
            portfolioService.deleteAsset(assetId, userEmail);
            // 204 No Content is the standard response for a successful delete.
            return ResponseEntity.noContent().build();
        }catch(EntityNotFoundException e){
            return ResponseEntity.notFound().build();
        }catch(AccessDeniedException e){
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }
}