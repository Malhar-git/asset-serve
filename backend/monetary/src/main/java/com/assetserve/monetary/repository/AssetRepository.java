package com.assetserve.monetary.repository;

import com.assetserve.monetary.model.Asset;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AssetRepository extends JpaRepository<Asset,Long> {
    List<Asset> findAllByUser_Id(Long id); //findByUserId is the keyword here which will tell spring data JPA to directly write Sql query

    List<Asset> findByUserId(Long id);
}
