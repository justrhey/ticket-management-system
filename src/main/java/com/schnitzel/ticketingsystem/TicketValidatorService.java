package com.schnitzel.ticketingsystem;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class TicketValidatorService {

    public boolean isValidFullName(String fullName) {
        if (!StringUtils.hasText(fullName)) {
            return false;
        }

        // Check length (5-20 characters)
        if (fullName.length() < 5 || fullName.length() > 20) {
            return false;
        }

        // Allow letters, spaces, hyphens, apostrophes - but NO digits
        for (int i = 0; i < fullName.length(); i++) {
            char c = fullName.charAt(i);
            if (!Character.isLetter(c) && c != ' ' && c != '-' && c != '\'' && c != '.') {
                return false; // Reject if contains digits or other special characters
            }
        }

        // Check if contains at least one space (first name + last name)
        if (!fullName.contains(" ")) {
            return false;
        }

        return true;
    }
    
}