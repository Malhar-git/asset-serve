package com.assetserve.monetary.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;



@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "user-watchlist", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"id", "symbolToken"})
})
public class UserWatchlist {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String symbolToken;

    @Column(nullable = false)
    private String symbolName;

    @Column(nullable = false)
    private Double currentLtp;

    @Column(nullable = false)
    private Double projectedBuyPrice;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}
