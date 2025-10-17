package com.schnitzel.ticketingsystem;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.time.LocalDateTime;

@Entity
@Table(name = "ticket")
public class Ticket{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long ticketId;

    private String fullName; //employee name
    private String ticketStatus; //status if already done ex. pending, done, in prog
    private String subject; // title of the concern
    private LocalDateTime requestedTime; // Date stamp
    @Column(name = "intent", length = 2000)
    private String intent; //Purpose of the ticket
    private String assignedPerson; //Optional if employee neee specific people
    private String priority;
    private String clientIpAddress;
    private String computerName;
    private String userAgent;
    private String itComment;

    //Default constructor wag tanngalin
    public Ticket(){
    }

    public Ticket(String fullName, String ticketStatus, String subject, 
                 LocalDateTime requestedTime, String intent, String assignedPerson, String priority,
                 String clientIpAddress, String computerName, String userAgent, String itComment) {
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
        this.itComment = itComment;
    }

    //Getters
    public Long getTicketId(){
        return this.ticketId;
    }

    public String getItComment(){
        return itComment;
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

    public String getIntent(){
        return intent;
    }

    public String getPriority(){
        return priority;
    }

    public LocalDateTime getRequestedTime(){
        return requestedTime;
    }
    

    public String getAssignedPerson(){
        return assignedPerson;
    }

    //Setters
    public void setClientIpAddress(String clientIpAddress){
        this.clientIpAddress = clientIpAddress;
    }

    public void setItComment(String itComment){
        this.itComment = itComment;
    }
    
    public void setComputerName(String computerName){
        this.computerName = computerName;
    }

    public void setUserAgent(String userAgent){
        this.userAgent = userAgent;
    }

    public void setTicketId(Long ticketId){
        this.ticketId = ticketId;
    }

    public void setPriority(String priority){
        this.priority = priority;
    }

    public void setFullName(String fullName){
        this.fullName = fullName;
    }

    public void setTicketStatus(String ticketStatus){
        this.ticketStatus = ticketStatus;
    }

    public void setSubject(String subject){
        this.subject = subject;
    }

    public void setRequestedTime(LocalDateTime requestedTime) {
        this.requestedTime = requestedTime;
    }


    public void setIntent(String intent){
        this.intent = intent;
    }

    public void setAssignedPerson(String assignedPerson){
        this.assignedPerson = assignedPerson;
    }


//Parsing to String
    @Override
    public String toString() {
        return "Ticket{" +
                "ticketId=" + ticketId +
                ", fullName='" + fullName + '\'' +
                ", ticketStatus='" + ticketStatus + '\'' +
                ", subject='" + subject + '\'' +
                ", requestedTime=" + requestedTime +
                ", intent='" + intent + '\'' +
                ", assignedPerson='" + assignedPerson + '\'' +
                ", priority='" + priority + '\'' +
                ", clientIpAddress='" + clientIpAddress + '\'' +
                ", computerName='" + computerName + '\'' +
                ", userAgent='" + userAgent + '\'' +
                '}';

    }
}


