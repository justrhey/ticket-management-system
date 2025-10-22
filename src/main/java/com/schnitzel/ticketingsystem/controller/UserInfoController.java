package com.schnitzel.ticketingsystem.controller;

import com.schnitzel.ticketingsystem.security.NetworkUtils;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
public class UserInfoController {

    @GetMapping("/whoami")
    public Map<String, String> whoami(HttpServletRequest request) {
        // Debug output (check your server logs)
        NetworkUtils.debugRequestInfo(request);  // CHANGED: was debugCorporateHeaders
        
        return NetworkUtils.whoami(request);
    }

    @GetMapping("/userinfo")
    public ResponseEntity<Map<String, Object>> getUserInfo(HttpServletRequest request) {
        Map<String, String> basicInfo = NetworkUtils.whoami(request);
        
        Map<String, Object> detailedInfo = new HashMap<>();
        detailedInfo.put("user", basicInfo);
        detailedInfo.put("timestamp", java.time.LocalDateTime.now().toString());
        detailedInfo.put("sessionId", request.getSession().getId());
        
        return ResponseEntity.ok(detailedInfo);
    }

    @GetMapping("/network-info")
    public Map<String, Object> getNetworkInfo(HttpServletRequest request) {
        Map<String, Object> networkInfo = new HashMap<>();
        
        networkInfo.put("clientIp", NetworkUtils.getClientIpAddress(request));
        networkInfo.put("clientHostname", NetworkUtils.getClientHostname(request));
        networkInfo.put("clientUsername", NetworkUtils.getClientUsername(request));
        networkInfo.put("serverInfo", NetworkUtils.getComputerName());
        networkInfo.put("userAgent", request.getHeader("User-Agent"));
        
        return networkInfo;
    }
}