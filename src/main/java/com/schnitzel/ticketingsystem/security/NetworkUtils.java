package com.schnitzel.ticketingsystem.security;

import jakarta.servlet.http.HttpServletRequest;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.security.Principal;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Map;

public class NetworkUtils {

    private static final String[] IP_HEADERS = {
        "X-Forwarded-For",
        "X-Real-IP",
        "Proxy-Client-IP",
        "WL-Proxy-Client-IP",
        "HTTP_X_FORWARDED_FOR",
        "HTTP_X_FORWARDED",
        "HTTP_X_CLUSTER_CLIENT_IP",
        "HTTP_CLIENT_IP",
        "HTTP_FORWARDED_FOR",
        "HTTP_FORWARDED",
        "HTTP_VIA",
        "CF-Connecting-IP",
        "True-Client-IP"
    };

    /**
     * Get real client IP address even behind proxies
     * This checks both direct connection and proxy headers
     */
    public static String getClientIpAddress(HttpServletRequest request) {
        System.out.println("\n=== DETECTING CLIENT IP ===");
        
        // FIRST: Check proxy headers (most reliable in corporate environments)
        for (String header : IP_HEADERS) {
            String ipList = request.getHeader(header);
            if (ipList != null && ipList.length() != 0 && !"unknown".equalsIgnoreCase(ipList)) {
                // X-Forwarded-For can contain multiple IPs: client, proxy1, proxy2
                String[] ips = ipList.split(",");
                for (String ip : ips) {
                    String cleanedIp = ip.trim();
                    if (!isUnknown(cleanedIp) && isValidIp(cleanedIp)) {
                        System.out.println("Found IP in header '" + header + "': " + cleanedIp);
                        return cleanedIp;
                    }
                }
            }
        }
        
        // SECOND: Get direct remote address
        String remoteAddr = request.getRemoteAddr();
        
        // Convert IPv6 localhost to IPv4
        if ("0:0:0:0:0:0:0:1".equals(remoteAddr) || "::1".equals(remoteAddr)) {
            remoteAddr = "127.0.0.1";
        }
        
        System.out.println("Using remote address: " + remoteAddr);
        return remoteAddr != null ? remoteAddr : "Unknown";
    }

    /**
     * Get client hostname by reverse DNS lookup
     */
    public static String getClientHostname(HttpServletRequest request) {
        String clientIp = getClientIpAddress(request);
        return getHostNameFromIp(clientIp);
    }

    /**
     * Resolve hostname from IP address using reverse DNS
     */
    public static String getHostNameFromIp(String ipAddress) {
        if (ipAddress == null || "Unknown".equals(ipAddress)) {
            return "Unknown-Host";
        }
        
        try {
            System.out.println("Attempting reverse DNS lookup for: " + ipAddress);
            InetAddress inetAddress = InetAddress.getByName(ipAddress);
            String hostname = inetAddress.getHostName();
            
            // If hostname equals IP, reverse DNS failed
            if (hostname.equals(ipAddress)) {
                System.out.println("Reverse DNS failed - no hostname found for: " + ipAddress);
                return "Unknown-Host";
            }
            
            System.out.println("Resolved hostname: " + hostname + " for IP: " + ipAddress);
            return hostname;
            
        } catch (UnknownHostException e) {
            System.out.println("Failed to resolve hostname for " + ipAddress + ": " + e.getMessage());
            return "Unknown-Host";
        }
    }

    /**
     * Get Windows domain username from various authentication sources
     */
    public static String getClientUsername(HttpServletRequest request) {
        System.out.println("\n=== DETECTING USERNAME ===");
        
        // Method 1: From HTTP headers (corporate proxy authentication)
        String username = request.getHeader("X-Forwarded-User");
        if (username != null && !username.isEmpty()) {
            System.out.println("Found username in X-Forwarded-User: " + username);
            return username;
        }
        
        username = request.getHeader("Remote-User");
        if (username != null && !username.isEmpty()) {
            System.out.println("Found username in Remote-User: " + username);
            return username;
        }
        
        username = request.getHeader("X-REMOTE-USER");
        if (username != null && !username.isEmpty()) {
            System.out.println("Found username in X-REMOTE-USER: " + username);
            return username;
        }
        
        // Method 2: From SSL client certificate
        String sslUser = request.getHeader("SSL_CLIENT_S_DN_CN");
        if (sslUser != null && !sslUser.isEmpty()) {
            System.out.println("Found username in SSL certificate: " + sslUser);
            return sslUser;
        }
        
        // Method 3: From Spring Security Principal
        Principal principal = request.getUserPrincipal();
        if (principal != null) {
            String principalName = principal.getName();
            System.out.println("Found username in Principal: " + principalName);
            return extractUsernameFromDomain(principalName);
        }
        
        // Method 4: From NTLM authentication
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("NTLM")) {
            System.out.println("Detected NTLM authentication");
            return extractNtlmUsername(authHeader);
        }
        
        System.out.println("No username found in any authentication source");
        return "Unknown-User";
    }

    /**
     * Extract username from domain formats: DOMAIN\\user or user@domain.com
     */
    private static String extractUsernameFromDomain(String domainUser) {
        if (domainUser == null) return "Unknown-User";
        
        if (domainUser.contains("\\")) {
            // DOMAIN\\username format
            return domainUser.substring(domainUser.lastIndexOf("\\") + 1);
        } else if (domainUser.contains("@")) {
            // username@domain.com format
            return domainUser.substring(0, domainUser.indexOf("@"));
        }
        
        return domainUser;
    }

    /**
     * Basic NTLM username extraction (simplified)
     */
    private static String extractNtlmUsername(String authHeader) {
        if (authHeader != null && authHeader.length() > 5) {
            System.out.println("NTLM Auth Header: " + authHeader.substring(0, Math.min(50, authHeader.length())));
        }
        return "NTLM-User";
    }

    /**
     * Get authentication method used
     */
    private static String getAuthMethod(HttpServletRequest request) {
        if (request.getHeader("X-Forwarded-User") != null) return "Proxy-Forwarded";
        if (request.getHeader("SSL_CLIENT_S_DN_CN") != null) return "SSL-Certificate";
        if (request.getHeader("Authorization") != null) {
            String auth = request.getHeader("Authorization");
            if (auth.startsWith("NTLM")) return "NTLM";
            if (auth.startsWith("Basic")) return "Basic";
            if (auth.startsWith("Bearer")) return "OAuth";
        }
        if (request.getUserPrincipal() != null) return "Application-Auth";
        return "Anonymous";
    }

    /**
     * Get proxy chain information
     */
    private static String getProxyChain(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        return xff != null ? xff : "Direct";
    }

    /**
     * Comprehensive whoami for requester information (like Unix whoami command)
     */
    public static Map<String, String> whoami(HttpServletRequest request) {
        Map<String, String> userInfo = new HashMap<>();
        
        System.out.println("\n=== WHOAMI - REQUEST INFORMATION ===");
        
        // User identity
        String username = getClientUsername(request);
        userInfo.put("username", username);
        userInfo.put("authenticationMethod", getAuthMethod(request));
        
        // Network information
        String ipAddress = getClientIpAddress(request);
        String hostname = getClientHostname(request);
        
        userInfo.put("ipAddress", ipAddress);
        userInfo.put("hostname", hostname);
        userInfo.put("userAgent", request.getHeader("User-Agent"));
        
        // Corporate proxy information
        userInfo.put("proxyChain", getProxyChain(request));
        userInfo.put("serverHostname", getComputerName());
        
        System.out.println("Username: " + username);
        System.out.println("IP Address: " + ipAddress);
        System.out.println("Hostname: " + hostname);
        System.out.println("User-Agent: " + request.getHeader("User-Agent"));
        System.out.println("Auth Method: " + getAuthMethod(request));
        System.out.println("=== END WHOAMI ===\n");
        
        return userInfo;
    }

    /**
     * Check if IP is valid
     */
    private static boolean isValidIp(String ip) {
        if (ip == null || ip.isEmpty()) return false;
        
        // Basic validation - not localhost or unknown
        return !isLocalhost(ip) && !isUnknown(ip);
    }

    /**
     * Check if IP is internal/private
     */
    private static boolean isInternal(String ip) {
        if (ip == null) return false;
        
        return ip.startsWith("10.") || 
               ip.startsWith("192.168.") || 
               ip.matches("172\\.(1[6-9]|2[0-9]|3[0-1])\\..*") ||
               ip.startsWith("127.") ||
               ip.startsWith("169.254.") ||
               ip.startsWith("fc") ||
               ip.startsWith("fd") ||
               ip.startsWith("fe80:");
    }

    /**
     * Check if IP is localhost
     */
    private static boolean isLocalhost(String ip) {
        return "127.0.0.1".equals(ip) || 
               "::1".equals(ip) || 
               "0:0:0:0:0:0:0:1".equals(ip) ||
               "localhost".equalsIgnoreCase(ip);
    }

    /**
     * Check if IP is unknown
     */
    private static boolean isUnknown(String ip) {
        return ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip);
    }

    /**
     * Get server computer name
     */
    public static String getComputerName() {
        try {
            // Try environment variables first (Windows: COMPUTERNAME, Linux: HOSTNAME)
            String hostname = System.getenv("COMPUTERNAME");
            if (hostname != null && !hostname.isEmpty()) {
                return hostname;
            }
            
            hostname = System.getenv("HOSTNAME");
            if (hostname != null && !hostname.isEmpty()) {
                return hostname;
            }
            
            // Fallback to Java's InetAddress
            return InetAddress.getLocalHost().getHostName();
            
        } catch (UnknownHostException e) {
            System.err.println("Failed to get server hostname: " + e.getMessage());
            return "Unknown-Server";
        }
    }

    /**
     * Complete debug method to see ALL request information
     * Use this to troubleshoot network detection issues
     */
    public static void debugRequestInfo(HttpServletRequest request) {
        System.out.println("\n" + "=".repeat(60));
        System.out.println("=== COMPLETE REQUEST DEBUG INFO ===");
        System.out.println("=".repeat(60));
        
        // Basic request info
        System.out.println("\n--- Basic Request Info ---");
        System.out.println("Remote Addr: " + request.getRemoteAddr());
        System.out.println("Remote Host: " + request.getRemoteHost());
        System.out.println("Remote Port: " + request.getRemotePort());
        System.out.println("Remote User: " + request.getRemoteUser());
        
        System.out.println("\n--- Server Info ---");
        System.out.println("Local Addr: " + request.getLocalAddr());
        System.out.println("Local Name: " + request.getLocalName());
        System.out.println("Local Port: " + request.getLocalPort());
        System.out.println("Server Name: " + request.getServerName());
        System.out.println("Server Port: " + request.getServerPort());
        System.out.println("Context Path: " + request.getContextPath());
        
        System.out.println("\n--- Request Details ---");
        System.out.println("Method: " + request.getMethod());
        System.out.println("Request URI: " + request.getRequestURI());
        System.out.println("Request URL: " + request.getRequestURL());
        System.out.println("Query String: " + request.getQueryString());
        System.out.println("Protocol: " + request.getProtocol());
        System.out.println("Scheme: " + request.getScheme());
        
        // All headers
        System.out.println("\n--- ALL Request Headers ---");
        Enumeration<String> headerNames = request.getHeaderNames();
        while (headerNames.hasMoreElements()) {
            String headerName = headerNames.nextElement();
            String headerValue = request.getHeader(headerName);
            System.out.println(headerName + ": " + headerValue);
        }
        
        // Authentication info
        System.out.println("\n--- Authentication Info ---");
        Principal principal = request.getUserPrincipal();
        if (principal != null) {
            System.out.println("Principal Name: " + principal.getName());
            System.out.println("Principal Class: " + principal.getClass().getName());
        } else {
            System.out.println("No Principal found");
        }
        
        System.out.println("\n--- Detected Network Info ---");
        System.out.println("Detected IP: " + getClientIpAddress(request));
        System.out.println("Detected Hostname: " + getClientHostname(request));
        System.out.println("Detected Username: " + getClientUsername(request));
        
        System.out.println("\n" + "=".repeat(60));
        System.out.println("=== END DEBUG INFO ===");
        System.out.println("=".repeat(60) + "\n");
    }

    /**
     * Main method to get client network info for ticket creation
     * IMPORTANT: This combines backend detection with frontend-provided data
     */
    public static Map<String, String> getClientNetworkInfo(HttpServletRequest request) {
        System.out.println("\n=== GETTING CLIENT NETWORK INFO FOR TICKET ===");
        
        Map<String, String> networkInfo = new HashMap<>();
        
        // Backend detection (from HTTP request)
        String backendIp = getClientIpAddress(request);
        String backendHostname = getHostNameFromIp(backendIp);
        String backendUsername = getClientUsername(request);
        String userAgent = request.getHeader("User-Agent");
        
        // Store backend-detected values
        networkInfo.put("clientIpAddress", backendIp);
        networkInfo.put("computerName", backendHostname);
        networkInfo.put("userName", backendUsername);
        networkInfo.put("userAgent", userAgent != null ? userAgent : "Unknown");
        networkInfo.put("serverName", getComputerName());
        
        System.out.println("Backend detected:");
        System.out.println("  - IP Address: " + backendIp);
        System.out.println("  - Computer Name: " + backendHostname);
        System.out.println("  - Username: " + backendUsername);
        System.out.println("  - User-Agent: " + userAgent);
        System.out.println("=== END CLIENT NETWORK INFO ===\n");
        
        return networkInfo;
    }

    /**
     * Merge frontend-provided network info with backend detection
     * Use this in your controller to combine both sources
     */
    public static Map<String, String> mergeNetworkInfo(
            String frontendPublicIp, 
            String frontendPrivateIp,
            String frontendComputerName,
            String frontendUsername,
            HttpServletRequest request) {
        
        System.out.println("\n=== MERGING FRONTEND AND BACKEND NETWORK INFO ===");
        
        Map<String, String> merged = new HashMap<>();
        
        // Get backend detection
        String backendIp = getClientIpAddress(request);
        String backendHostname = getHostNameFromIp(backendIp);
        String backendUsername = getClientUsername(request);
        
        // Use frontend data if available and valid, otherwise use backend
        
        // Public IP - prefer frontend (more accurate)
        String publicIp = (frontendPublicIp != null && !frontendPublicIp.equals("Unknown")) 
            ? frontendPublicIp : backendIp;
        merged.put("publicIpAddress", publicIp);
        System.out.println("Public IP: " + publicIp + " (from " + 
            (frontendPublicIp != null && !frontendPublicIp.equals("Unknown") ? "frontend" : "backend") + ")");
        
        // Private IP - only from frontend
        String privateIp = (frontendPrivateIp != null && !frontendPrivateIp.equals("Unknown")) 
            ? frontendPrivateIp : "Not-Detected";
        merged.put("privateIpAddress", privateIp);
        System.out.println("Private IP: " + privateIp);
        
        // Computer name - try frontend first, then backend
        String computerName = (frontendComputerName != null && !frontendComputerName.equals("Unknown")) 
            ? frontendComputerName : backendHostname;
        merged.put("computerName", computerName);
        System.out.println("Computer Name: " + computerName + " (from " + 
            (frontendComputerName != null && !frontendComputerName.equals("Unknown") ? "frontend" : "backend") + ")");
        
        // Username - try frontend first, then backend
        String username = (frontendUsername != null && !frontendUsername.equals("Unknown-User")) 
            ? frontendUsername : backendUsername;
        merged.put("userName", username);
        System.out.println("Username: " + username + " (from " + 
            (frontendUsername != null && !frontendUsername.equals("Unknown-User") ? "frontend" : "backend") + ")");
        
        // User Agent
        String userAgent = request.getHeader("User-Agent");
        merged.put("userAgent", userAgent != null ? userAgent : "Unknown");
        
        System.out.println("=== END MERGE ===\n");
        
        return merged;
    }
}