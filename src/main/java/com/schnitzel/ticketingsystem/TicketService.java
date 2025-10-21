package com.schnitzel.ticketingsystem;

import com.schnitzel.ticketingsystem.TicketValidatorService;
import com.schnitzel.ticketingsystem.service.EmailService;
import java.util.List;
import java.util.Optional;
import java.time.LocalDateTime;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Service
public class TicketService {

    @Autowired
    private TicketRepository ticketRepository; 

    @Autowired
    private TicketValidatorService validator;

    @Autowired
    private EmailService emailService;

    public boolean updateTicket(Long ticketId, String fullName, String ticketStatus, String subject, 
                 LocalDateTime requestedTime, String intent, String assignedPerson, String priority,
                 String clientIpAddress, String computerName, String userAgent, String itComment){
        Optional<Ticket> existingTicket = ticketRepository.findById(ticketId); 
        if(existingTicket.isPresent()){
            Ticket ticket = existingTicket.get();
            
            // Update fields if provided
            if(fullName != null && !fullName.trim().isEmpty()){
                ticket.setFullName(fullName.trim());
            }
            if(ticketStatus != null && !ticketStatus.trim().isEmpty()){
                ticket.setTicketStatus(ticketStatus.trim());
            }
            if(subject != null && !subject.trim().isEmpty()){
                ticket.setSubject(subject.trim());
            }
            if(requestedTime != null){
                ticket.setRequestedTime(requestedTime);
            }
            if(intent != null && !intent.trim().isEmpty()){
                ticket.setIntent(intent.trim());
            }
            if(assignedPerson != null){
                ticket.setAssignedPerson(assignedPerson.trim());
            }
            if(priority != null){
                ticket.setPriority(priority.trim());
            }
            if(clientIpAddress != null){
                ticket.setClientIpAddress(clientIpAddress.trim());
            }
            if(computerName != null){
                ticket.setComputerName(computerName.trim());
            }
            if(userAgent != null){
                ticket.setUserAgent(userAgent.trim());
            }
            if(itComment != null){
                ticket.setItComment(itComment.trim());
            }
            
            ticketRepository.save(ticket);
            return true;
        }
        return false;
    }

    public boolean registerTicket(String fullName, String ticketStatus, String subject, 
                 LocalDateTime requestedTime, String intent, String assignedPerson, String priority,
                 String clientIpAddress, String computerName, String userAgent, String itComment){
        
        // Validate input
        if(!validator.isValidFullName(fullName)){
            return false;
        }

        // Create new ticket
        Ticket newTicket = new Ticket(fullName, ticketStatus, subject, requestedTime, intent, assignedPerson, priority, clientIpAddress, computerName, userAgent, itComment);
        ticketRepository.save(newTicket);
        return true;
    }

    public Optional<Ticket> findTicketById(Long ticketId){
        return ticketRepository.findById(ticketId);
    }
    
    public List<Ticket> getAllTickets(){
        return ticketRepository.findAll();
    }

    // FIXED: Renamed to avoid conflict
    public Page<Ticket> getAllTicketsPaginated(Pageable pageable){ 
        return ticketRepository.findAll(pageable);
    }

    public boolean deleteTicket(Long ticketId){
        if(ticketRepository.existsById(ticketId)){ 
            ticketRepository.deleteById(ticketId);
            return true;
        }
        return false;
    }

    public List<Ticket> searchTickets(String query){ 
        return ticketRepository.findByTicketStatusContainingOrFullNameContaining(query, query);
    }

    public Ticket createTicket(String fullName, String subject, String description, String assignedPerson, String priority, String clientIpAddress,
    String computerName, String userAgent, String itComment) {
        // Validate input first
        if(!validator.isValidFullName(fullName)){
            throw new IllegalArgumentException("Invalid full name");
        }

        Ticket newTicket = new Ticket();
        newTicket.setFullName(fullName);
        newTicket.setSubject(subject);
        newTicket.setIntent(description); // Using 'intent' field for description
        newTicket.setAssignedPerson(assignedPerson);
        newTicket.setTicketStatus("Open");
        newTicket.setRequestedTime(java.time.LocalDateTime.now());
        newTicket.setPriority(priority);
        newTicket.setClientIpAddress(clientIpAddress);
        newTicket.setComputerName(computerName);
        newTicket.setUserAgent(userAgent);
        newTicket.setItComment(itComment);

        Ticket savedTicket = ticketRepository.save(newTicket);
        
        // Send email notification
        emailService.sendNewTicketNotification(fullName, subject, description);
        
        return savedTicket;
    }

    public List<Ticket> getFilteredTickets(List<String> status, String search) {
        if ((status == null || status.isEmpty()) && (search == null || search.isEmpty())) {
            return getAllTickets();
        }
        
        // Implement basic filtering logic
        List<Ticket> allTickets = getAllTickets();
        
        return allTickets.stream()
            .filter(ticket -> {
                boolean statusMatch = status == null || status.isEmpty() || 
                                   status.contains(ticket.getTicketStatus());
                boolean searchMatch = search == null || search.isEmpty() ||
                                    containsSearchTerm(ticket, search);
                return statusMatch && searchMatch;
            })
            .collect(Collectors.toList());
    }
    
    private boolean containsSearchTerm(Ticket ticket, String search) {
        String searchLower = search.toLowerCase();
        return (ticket.getSubject() != null && ticket.getSubject().toLowerCase().contains(searchLower)) ||
               (ticket.getFullName() != null && ticket.getFullName().toLowerCase().contains(searchLower)) ||
               (ticket.getIntent() != null && ticket.getIntent().toLowerCase().contains(searchLower)) ||
               (ticket.getAssignedPerson() != null && ticket.getAssignedPerson().toLowerCase().contains(searchLower));
    }
}