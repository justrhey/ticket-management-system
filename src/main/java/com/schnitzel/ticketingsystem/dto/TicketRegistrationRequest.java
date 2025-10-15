package com.schnitzel.ticketingsystem.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

public class TicketRegistrationRequest {

    private Long ticketId;
    
    @NotBlank(message = "Full Name is required")
    @Size(min = 5, max = 20, message = "Full Name must be 5-20 characters")
    private String fullName;
    
    private String ticketStatus;
    private String subject;
    private LocalDateTime requestedTime;
    private String intent;
    private String assignedPerson;
    private String priority;

    public TicketRegistrationRequest() {
    }

    public TicketRegistrationRequest(Long ticketId, String fullName, String ticketStatus, 
                                    String subject, LocalDateTime requestedTime,
                                    String intent, String assignedPerson, String priority) {
        this.ticketId = ticketId;
        this.fullName = fullName;
        this.ticketStatus = ticketStatus;
        this.subject = subject;
        this.requestedTime = requestedTime;
        this.intent = intent;
        this.assignedPerson = assignedPerson;
        this.priority = priority;
    }

    public Long getTicketId() {
        return this.ticketId;
    }

    public String getFullName() {
        return fullName;
    }

    public String getTicketStatus() {
        return ticketStatus;
    }

    public String getSubject() {
        return subject;
    }

    public LocalDateTime getRequestedTime() {
        return requestedTime;
    }

    public String getIntent() {
        return intent;
    }

    public String getAssignedPerson() {
        return assignedPerson;
    }

    public String getPriority(){
        return priority;
    }

    public void setPriority(String priority){
        this.priority = priority;
    }

    public void setTicketId(Long ticketId) {
        this.ticketId = ticketId;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public void setTicketStatus(String ticketStatus) {
        this.ticketStatus = ticketStatus;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public void setRequestedTime(LocalDateTime requestedTime) {
        this.requestedTime = requestedTime;
    }

    public void setIntent(String intent) {
        this.intent = intent;
    }

    public void setAssignedPerson(String assignedPerson) {
        this.assignedPerson = assignedPerson;
    }
}