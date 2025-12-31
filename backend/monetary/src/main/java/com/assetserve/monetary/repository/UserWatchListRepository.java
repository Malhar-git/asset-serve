package com.assetserve.monetary.repository;

import com.assetserve.monetary.model.UserWatchlist;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserWatchListRepository extends JpaRepository<UserWatchlist, Long> {
    List<UserWatchlist> findByUserId(Long userId);
    Optional<UserWatchlist> findByUserIdAndSymbolToken(Long userId, String symbolToken);
    boolean existsByUserIdAndSymbolToken(Long userId, String symbolToken);
    void deleteByUserIdAndSymbolToken(Long userId, String symbolToken);
}
