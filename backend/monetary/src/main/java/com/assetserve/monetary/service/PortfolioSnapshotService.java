package com.assetserve.monetary.service;

import com.assetserve.monetary.dto.PortfolioAssetResponse;
import com.assetserve.monetary.model.PortfolioHistory;
import com.assetserve.monetary.model.User;
import com.assetserve.monetary.repository.PortfolioHistoryRepository;
import com.assetserve.monetary.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PortfolioSnapshotService {

    private final UserRepository userRepository;
    private final PortfolioService portfolioService;
    private final PortfolioHistoryRepository portfolioHistoryRepository;

    @PostConstruct
        public void takeDailySnapshot(){
        log.info("--- Starting Daily Portfolio Snapshot Job ---");

        List<User> allUsers = userRepository.findAll();

        for (User user : allUsers) {
            try{
                List<PortfolioAssetResponse> portfolio = portfolioService.getPortfolio(user.getEmail());

                BigDecimal portfolioValue = portfolio.stream()
                        .map(PortfolioAssetResponse::getTotalValue)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                PortfolioHistory snaphot = PortfolioHistory.builder()
                        .user(user)
                        .snapshotData(LocalDate.now())
                        .portfolioValue(portfolioValue)
                        .build();

                portfolioHistoryRepository.save(snaphot);

                log.info("Successfully saved snapshot for user: {}", user.getEmail());
            }catch (Exception e){
                log.error("Error while saving snapshot for user: {}", user.getEmail(), e);
            }
        }
        log.info("--- Ending Daily Portfolio Snapshot Job ---");
    }

}
