package com.schnitzel.ticketingsystem;

import com.schnitzel.ticketingsystem.dto.TicketRegistrationRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/tickets")
public class TicketController {
    
    @Autowired
    private TicketService ticketService;

    // KEEP THIS JSON VERSION - Remove the @RequestParam version
    @PostMapping
    public ResponseEntity<String> createTicket(@RequestBody TicketRegistrationRequest request) {
        try {
            // Use the createTicket method that sends emails
            Ticket createdTicket = ticketService.createTicket(
                request.getFullName(),
                request.getSubject(),
                request.getIntent(), // This is the description
                request.getAssignedPerson(),
                request.getPriority()
            );
            
            return ResponseEntity.status(HttpStatus.CREATED).body("Ticket created successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to create ticket: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<Ticket>> getAllTickets() {
        List<Ticket> tickets = ticketService.getAllTickets();
        return ResponseEntity.ok(tickets);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Ticket> getTicketById(@PathVariable Long id) {
        Optional<Ticket> ticket = ticketService.findTicketById(id);
        return ticket.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<String> updateTicket(@PathVariable Long id, @RequestBody TicketRegistrationRequest request) {
        boolean updated = ticketService.updateTicket(
            id,
            request.getFullName(),
            request.getTicketStatus(),
            request.getSubject(),
            request.getRequestedTime(),
            request.getIntent(),
            request.getAssignedPerson(),
            request.getPriority()
        );
        
        return updated ? 
            ResponseEntity.ok("Ticket updated successfully") :
            ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteTicket(@PathVariable Long id) {
        boolean deleted = ticketService.deleteTicket(id);
        return deleted ? 
            ResponseEntity.ok("Ticket deleted successfully") :
            ResponseEntity.notFound().build();
    }

    @GetMapping("/search")
    public ResponseEntity<List<Ticket>> searchTickets(@RequestParam String query) {
        List<Ticket> tickets = ticketService.searchTickets(query);
        return ResponseEntity.ok(tickets);
    }
    
  
}