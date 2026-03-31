package com.Campus_Hub.Smart_Campus_Operations_Hub;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
@RestController
public class SmartCampusOperationsHubApplication {

    public static void main(String[] args) {
        SpringApplication.run(SmartCampusOperationsHubApplication.class, args);
    }

    @GetMapping("/health")
    public String health() {
        return "OK - Smart Campus Application is Running!";
    }
    
    @GetMapping("/")
    public String home() {
        return "Smart Campus Operations Hub - Booking Management Module";
    }
}