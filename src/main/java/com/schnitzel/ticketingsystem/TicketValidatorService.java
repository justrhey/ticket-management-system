package com.schnitzel.ticketingsystem;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class TicketValidatorService {

    public boolean isValidFullName(String fullName) {
        if (!StringUtils.hasText(fullName)) {
            return false;
        }

        // Check length (1-255 characters - increased for emails)
        if (fullName.length() < 1 || fullName.length() > 255) {
            return false;
        }

        // Check if it's an email (contains @) - allow email format
        if (fullName.contains("@")) {
            // Simple email validation: allow letters, numbers, @, ., -, _
            for (int i = 0; i < fullName.length(); i++) {
                char c = fullName.charAt(i);
                if (!Character.isLetterOrDigit(c) && c != '@' && c != '.' && c != '-' && c != '_') {
                    return false;
                }
            }
            return true;
        }
        
        // If not an email, use the original name validation
        // Allow letters, spaces, hyphens, apostrophes, periods
        for (int i = 0; i < fullName.length(); i++) {
            char c = fullName.charAt(i);
            if (!Character.isLetter(c) && c != ' ' && c != '-' && c != '\'' && c != '.') {
                return false;
            }
        }



        return true;
    }
    
}