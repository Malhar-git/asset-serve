package com.assetserve.monetary.repository;

import com.assetserve.monetary.model.PortfolioHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface PortfolioHistoryRepository extends JpaRepository<PortfolioHistory, Long> {
    /**
     * This is the "magic" method for our chart.
     * Spring Data JPA will automatically write the SQL query:
     * "SELECT * FROM portfolio_history
     * WHERE user_id = ?
     * AND snapshot_date > ?
     * ORDER BY snapshot_date ASC"
     */
    List<PortfolioHistory> findByUserIdAndSnapshotDataAfterOrderBySnapshotDataAsc(Long userId, LocalDate afterDate);
}
