package com.assetserve.monetary.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class AddAssetRequest {
    @NotNull(message = "Symbol must not be empty")
    private String assetSymbol;

    @NotNull(message = "Pls Specify the asset type")
    private String assetType;

    @NotNull(message = "Quantity cannot be null")
    @DecimalMin(value = "0.0001", message = "Quantity must be greater than 0")
    private BigDecimal quantity;

    @NotNull(message = "PurchasePrice cannot be null")
    @DecimalMin(value  ="0.0001", message = "Price must be greater than 0")
    private BigDecimal purchasePrice;

}
