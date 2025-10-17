package com.schnitzel.ticketingsystem.security;

import jakarta.servlet.http.HttpServletRequest;
import java.net.InetAddress;
import java.net.UnknownHostException;


public class NetworkUtils{

    public static String getClientIpAddress(HttpServletRequest request){
        String ipAddress = request.getHeader("X-Forwared-For");

        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getHeader("Proxy-Client-IP");
        }
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getHeader("HTTP_CLIENT_IP");
        }
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getHeader("HTTP_X_FORWARDED_FOR");
        }
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getRemoteAddr();
        }

        if(ipAddress != null && ipAddress.contains(",")){
            ipAddress = ipAddress.split(",")[0].trim();
        }

        return ipAddress;
    }

    public static String getComputerName(){
        try {
            InetAddress inetAddress = InetAddress.getLocalHost();
            return inetAddress.getHostName();
        }catch(UnknownHostException e){
            return "Unknown";
        }
    }

    public static String getHostNameFromIp(String ipAddress){
        try{
            InetAddress inetAddress = InetAddress.getByName(ipAddress);
            return inetAddress.getHostName();
        }catch(UnknownHostException e){
            return "Unknown";
        }
    }
}