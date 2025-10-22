package com.schnitzel.ticketingsystem.controller;

import com.schnitzel.ticketingsystem.security.NetworkUtils;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/network")
@CrossOrigin(origins = "*")

public class NetworkController {

    /**
     * Test network detection - shows all headers and detected info
     */
    @GetMapping("/test")
    public ResponseEntity<Map<String, String>> testNetwork(HttpServletRequest request) {
        // Print complete debug info to console
        NetworkUtils.debugRequestInfo(request);
        
        // Return detected network info
        Map<String, String> networkInfo = NetworkUtils.getClientNetworkInfo(request);
        return ResponseEntity.ok(networkInfo);
    }

    /**
     * Get client network info
     */
    @GetMapping("/info")
    public ResponseEntity<Map<String, String>> getNetworkInfo(HttpServletRequest request) {
        Map<String, String> networkInfo = NetworkUtils.getClientNetworkInfo(request);
        return ResponseEntity.ok(networkInfo);
    }

    /**
     * Whoami endpoint
     */
    @GetMapping("/whoami")
    public ResponseEntity<Map<String, String>> whoami(HttpServletRequest request) {
        Map<String, String> info = NetworkUtils.whoami(request);
        return ResponseEntity.ok(info);
    }
}