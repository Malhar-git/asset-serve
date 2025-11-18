package com.assetserve.monetary;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class MonetaryApplication {

	public static void main(String[] args) {
		SpringApplication.run(MonetaryApplication.class, args);
	}

}
