package com.schnitzel.ticketingsystem.dto;

import java.time.LocalDateTime;

public class TicketRegistrationRequest {
    private String fullName;
    private String ticketStatus;
    private String subject;
    private LocalDateTime requestedTime;
    private String intent;
    private String assignedPerson;
    private String priority;
    private String clientIpAddress;
    private String computerName;
    private String userAgent;
    private String itComment;
    
    // Only add closedTime
    private LocalDateTime closedTime;

    // Default constructor
    public TicketRegistrationRequest() {}

    // Getters and Setters for all fields
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getTicketStatus() { return ticketStatus; }
    public void setTicketStatus(String ticketStatus) { this.ticketStatus = ticketStatus; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public LocalDateTime getRequestedTime() { return requestedTime; }
    public void setRequestedTime(LocalDateTime requestedTime) { this.requestedTime = requestedTime; }

    public String getIntent() { return intent; }
    public void setIntent(String intent) { this.intent = intent; }

    public String getAssignedPerson() { return assignedPerson; }
    public void setAssignedPerson(String assignedPerson) { this.assignedPerson = assignedPerson; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public String getClientIpAddress() { return clientIpAddress; }
    public void setClientIpAddress(String clientIpAddress) { this.clientIpAddress = clientIpAddress; }

    public String getComputerName() { return computerName; }
    public void setComputerName(String computerName) { this.computerName = computerName; }

    public String getUserAgent() { return userAgent; }
    public void setUserAgent(String userAgent) { this.userAgent = userAgent; }

    public String getItComment() { return itComment; }
    public void setItComment(String itComment) { this.itComment = itComment; }

    // Only closedTime getter and setter
    public LocalDateTime getClosedTime() { return closedTime; }
    public void setClosedTime(LocalDateTime closedTime) { this.closedTime = closedTime; }
}