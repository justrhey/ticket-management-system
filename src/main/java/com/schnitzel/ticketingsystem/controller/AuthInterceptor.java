package com.schnitzel.ticketingsystem.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class AuthInterceptor implements HandlerInterceptor {
    
    @Override
    public boolean preHandle(HttpServletRequest request, 
                           HttpServletResponse response, 
                           Object handler) throws Exception {
        
        HttpSession session = request.getSession(false);
        String requestURI = request.getRequestURI();
        
        // Allow public endpoints and static resources
        if (isPublicEndpoint(requestURI) || isStaticResource(requestURI)) {
            return true;
        }
        
        // Check if user is authenticated for protected pages
        if (session == null || session.getAttribute("user") == null) {
            response.sendRedirect("/login");
            return false;
        }
        
        return true;
    }
    
    private boolean isPublicEndpoint(String uri) {
        return uri.equals("/") ||  // Root is public (index.html)
               uri.equals("/login") || 
               uri.equals("/tickets") || // Tickets page is public
               uri.startsWith("/api/tickets") || // Allow ticket APIs (viewing)
               uri.startsWith("/api/public/") ||
               uri.equals("/error");
    }
    
    private boolean isStaticResource(String uri) {
        return uri.startsWith("/css/") || 
               uri.startsWith("/js/") || 
               uri.startsWith("/images/") ||
               uri.startsWith("/webjars/") ||
               uri.endsWith(".html") ||
               uri.endsWith(".css") ||
               uri.endsWith(".js") ||
               uri.endsWith(".png") ||
               uri.endsWith(".jpg") ||
               uri.endsWith(".ico");
    }
}