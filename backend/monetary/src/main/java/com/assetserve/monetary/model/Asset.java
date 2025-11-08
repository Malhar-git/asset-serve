package com.assetserve.monetary.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal; // Using BigDecimal for money is best practice

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "assets")
public class Asset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String symbol; // e.g., "RELIANCE.NS", "GOLDM.MCX"

    @Column(nullable = false)
    private String assetType; // e.g., "STOCK", "COMMODITY", "CASH"

    @Column(nullable = false, precision = 19, scale = 4) // precision/scale for money
    private BigDecimal quantity; // e.g., 10 (shares), 50.5 (grams)

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal purchasePrice; // The price per unit when they bought it

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;
}