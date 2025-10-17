package com.schnitzel.ticketingsystem.dto;

import java.time.LocalDateTime;

public class TicketResponse{

    private Long ticketId;
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

    public TicketResponse(Long ticketId, String fullName, 
    String ticketStatus, String subject, LocalDateTime requestedTime,
    String intent, String assignedPerson, String priority,
    String clientIpAddress, String computerName, String userAgent){
        this.ticketId = ticketId;
        this.fullName = fullName;
        this.ticketStatus = ticketStatus;
        this.subject = subject;
        this.requestedTime = requestedTime;
        this.intent = intent;
        this.assignedPerson = assignedPerson;
        this.priority = priority;
        this.clientIpAddress = clientIpAddress;
        this.computerName = computerName;
        this.userAgent = userAgent;
    }

    public Long getTicketId(){
        return this.ticketId;
    }
    public String getClientIpAddress(){
        return clientIpAddress;
    }

    public String getComputerName(){
        return computerName;
    }

    public String getUserAgent(){
        return userAgent;
    }

    public String getFullName(){
        return fullName;
    }
    public String getTicketStatus(){
        return ticketStatus;
    }
    public String getSubject(){
        return subject;
    }
    public String getPriority(){
        return priority;
    }
    public LocalDateTime getRequestedTime(){
        return requestedTime;
    }
    public String getIntent(){
        return intent;
    }
    public String getAssignedPerson(){
        return assignedPerson;
    }
}