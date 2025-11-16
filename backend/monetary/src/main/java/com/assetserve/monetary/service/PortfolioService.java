package com.assetserve.monetary.service;

import com.assetserve.monetary.dto.AddAssetRequest;
import com.assetserve.monetary.dto.PortfolioAssetResponse;
import com.assetserve.monetary.model.Asset;
import com.assetserve.monetary.model.User;
import com.assetserve.monetary.repository.AssetRepository;
import com.assetserve.monetary.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.nio.file.AccessDeniedException;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PortfolioService {

    private final UserRepository userRepository;
    private final AssetRepository assetRepository;
    private final MarketDataService marketDataService;

    public Asset addAsset(AddAssetRequest request, String userEmail) {
        //1. Find the user who is making this request
        User user = userRepository.findByEmail(userEmail).
                orElseThrow(() -> new UsernameNotFoundException("User not found"));

        // new Asset Object from DTO
        Asset newAsset = Asset.builder()
                .exchange(request.getExchange())
                .symbolToken(request.getSymbolToken())
                .symbol(request.getAssetSymbol())
                .assetType(request.getAssetType())
                .quantity(request.getQuantity())
                .purchasePrice(request.getPurchasePrice())
                .user(user) //link this asset to logged in User
                .build();

        return assetRepository.save(newAsset);
    }

    public List<PortfolioAssetResponse> getPortfolio(String userEmail){
        User user = userRepository.findByEmail(userEmail).
                orElseThrow(() -> new UsernameNotFoundException("User not found"));

        List<Asset> assets = assetRepository.findByUserId(user.getId());

        return assets.stream().map(asset -> {
            double ltpDouble = marketDataService.getLtp(asset.getExchange(),
                    asset.getSymbol(),// e.g., "RELIANCE.NS"
                    asset.getSymbolToken()
            );

            BigDecimal currentPrice = BigDecimal.valueOf(ltpDouble);
            BigDecimal totalValue = currentPrice.multiply(asset.getQuantity());
            BigDecimal costBasis = asset.getPurchasePrice().multiply(asset.getQuantity());
            BigDecimal profitAndLoss = totalValue.subtract(costBasis);

            //Building the DTO
            return PortfolioAssetResponse.builder()
                    .id(asset.getId())
                    .symbol(asset.getSymbol())
                    .assetType(asset.getAssetType())
                    .quantity(String.valueOf(asset.getQuantity()))
                    .assetPrice(String.valueOf(asset.getPurchasePrice()))
                    .currentPrice(currentPrice)
                    .totalValue(totalValue)
                    .profitAndLoss(profitAndLoss)
                    .build();
        }).collect(Collectors.toList());

    }


    public void deleteAsset(Long assetId, String userEmail) throws AccessDeniedException {
        User user = userRepository.findByEmail(userEmail).
                orElseThrow(() -> new UsernameNotFoundException("User not found"));

        Asset asset = assetRepository.findById(assetId)
                .orElseThrow(()-> new UsernameNotFoundException("Asset not found with id" + assetId));

        //Check if the asset's user ID matches the logged-in user's ID if not throw an error.
        if(!asset.getUser().getId().equals(user.getId())){
            throw new AccessDeniedException("You do not have permission to delete this assets");
        }

        assetRepository.delete(asset);
    }
}
