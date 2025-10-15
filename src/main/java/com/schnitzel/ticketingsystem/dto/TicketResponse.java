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

    public TicketResponse(Long ticketId, String fullName, 
    String ticketStatus, String subject, LocalDateTime requestedTime,
    String intent, String assignedPerson, String priority){
        this.ticketId = ticketId;
        this.fullName = fullName;
        this.ticketStatus = ticketStatus;
        this.subject = subject;
        this.requestedTime = requestedTime;
        this.intent = intent;
        this.assignedPerson = assignedPerson;
        this.priority = priority;
    }

    public Long getTicketId(){
        return this.ticketId;
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