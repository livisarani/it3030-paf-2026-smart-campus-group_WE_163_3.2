package com.smartcampus;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Smart Campus Operations Hub
 * IT3030 – Programming Applications and Frameworks
 * Group: WE_163_3.2  |  Member 4: Notifications + Role Management + OAuth
 */
@SpringBootApplication
@EnableJpaAuditing
@EnableAsync
public class SmartCampusApplication {
    public static void main(String[] args) {
        SpringApplication.run(SmartCampusApplication.class, args);
    }
}
