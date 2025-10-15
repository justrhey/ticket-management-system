package com.schnitzel.ticketingsystem.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;
    
    @Value("${it.company.email:it@visrspacio.com}")
    private String itCompanyEmail;
    
    public void sendNewTicketNotification(String requesterName, String subject, String description) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(itCompanyEmail);
            message.setSubject("🎫 New Support Ticket: " + subject);
            message.setText(
                "A new support ticket has been created:\n\n" +
                "👤 Requester: " + requesterName + "\n" +
                "📋 Subject: " + subject + "\n" +
                "📝 Description: " + description + "\n\n" +
                "⏰ Created: " + java.time.LocalDateTime.now() + "\n\n" +
                "Please check the ticketing system to address this ticket."
            );
            
            mailSender.send(message);
            System.out.println("✅ Email sent successfully to: " + itCompanyEmail);
            
        } catch (Exception e) {
            System.out.println("❌ Failed to send email: " + e.getMessage());
            e.printStackTrace();
        }
    }
}