package com.assetserve.monetary.service;

import com.assetserve.monetary.dto.AddAssetRequest;
import com.assetserve.monetary.model.Asset;
import com.assetserve.monetary.model.User;
import com.assetserve.monetary.repository.AssetRepository;
import com.assetserve.monetary.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import java.util.List;
@Service
@RequiredArgsConstructor
public class PortfolioService {

    private final UserRepository userRepository;
    private final AssetRepository assetRepository;

    public Asset addAsset(AddAssetRequest request, String userEmail) {
        //1. Find the user who is making this request
        User user = userRepository.findByEmail(userEmail).
                orElseThrow(() -> new UsernameNotFoundException("User not found"));

        // new Asset Object from DTO
        Asset asset = Asset.builder()
                .symbol(request.getAssetSymbol())
                .assetType(request.getAssetType())
                .quantity(request.getQuantity())
                .purchasePrice(request.getPurchasePrice())
                .user(user) //link this asset to logged in User
                .build();

        return assetRepository.save(asset);
    }

    public List<Asset> getPortfolio(String userEmail){
        User user = userRepository.findByEmail(userEmail).
                orElseThrow(() -> new UsernameNotFoundException("User not found"));

        return assetRepository.findByUserId(user.getId());
    }
}
