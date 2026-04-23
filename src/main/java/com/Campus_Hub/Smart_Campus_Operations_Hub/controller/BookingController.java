package com.Campus_Hub.Smart_Campus_Operations_Hub.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

// Stub – Member 2 will implement booking logic
@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    @GetMapping
    public ResponseEntity<Map<String, String>> placeholder() {
        return ResponseEntity.ok(Map.of("message", "Booking module – to be implemented by Member 2"));
    }
}

