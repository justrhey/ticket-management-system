package com.schnitzel.ticketingsystem.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class StaticResourceConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Serve files from the sounds directory
        registry.addResourceHandler("/sounds/**")
                .addResourceLocations("classpath:/sounds/");
        
        System.out.println("Sound files configured: /sounds/ -> classpath:/sounds/");
    }
}