package com.schnitzel.ticketingsystem.config;

import com.schnitzel.ticketingsystem.controller.AuthInterceptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Autowired
    private AuthInterceptor authInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(authInterceptor)
                .addPathPatterns("/**")
                .excludePathPatterns("/", "/login", "/tickets", "/css/**", "/js/**", "/images/**", 
                                   "/webjars/**", "/error", "/favicon.ico", 
                                   "/api/tickets", "/api/tickets/search"); // Allow public ticket APIs
    }
}