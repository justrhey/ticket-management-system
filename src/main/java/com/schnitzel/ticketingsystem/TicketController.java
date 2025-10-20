package com.schnitzel.ticketingsystem;

import com.schnitzel.ticketingsystem.dto.TicketRegistrationRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletResponse;
import java.io.PrintWriter;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/tickets")
public class TicketController {
    
    @Autowired
    private TicketService ticketService;

    @PostMapping
    public ResponseEntity<String> createTicket(@RequestBody TicketRegistrationRequest request) {
        try {
            Ticket createdTicket = ticketService.createTicket(
                request.getFullName(),
                request.getSubject(),
                request.getIntent(), // This is the description
                request.getAssignedPerson(),
                request.getPriority(),
                request.getClientIpAddress(),
                request.getComputerName(),
                request.getUserAgent(),
                request.getItComment()
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
            request.getPriority(),  
            request.getClientIpAddress(),
            request.getComputerName(),
            request.getUserAgent(),
            request.getItComment()
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

    @GetMapping("/export/csv")
    public void exportTicketsToCsv(
            @RequestParam(required = false) List<String> status,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) List<Long> ticketIds,
            HttpServletResponse response) {
        
        try {
            List<Ticket> tickets;
            
            // If specific ticket IDs are provided, export only those
            if (ticketIds != null && !ticketIds.isEmpty()) {
                tickets = ticketService.getTicketsByIds(ticketIds);
            } else {
                // Apply filters if provided
                tickets = ticketService.getFilteredTickets(status, search);
            }
            
            // Set response headers for CSV download
            response.setContentType("text/csv");
            response.setCharacterEncoding("UTF-8");
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
            String filename = "tickets_export_" + timestamp + ".csv";
            response.setHeader(HttpHeaders.CONTENT_DISPOSITION, 
                "attachment; filename=\"" + filename + "\"");
            
            // Generate CSV
            generateCsv(response.getWriter(), tickets);
            
        } catch (Exception e) {
            throw new RuntimeException("Failed to export CSV: " + e.getMessage(), e);
        }
    }
    
    private void generateCsv(PrintWriter writer, List<Ticket> tickets) {
        // Write CSV header
        writer.println("TicketID,Subject,Requester,Status,Priority,AssignedTo,CreatedDate,Description,ITComments,ClientIP,ComputerName,UserAgent");
        
        // Write data rows
        for (Ticket ticket : tickets) {
            writer.println(
                escapeCsv(ticket.getTicketId().toString()) + "," +
                escapeCsv(ticket.getSubject()) + "," +
                escapeCsv(ticket.getFullName()) + "," +
                escapeCsv(ticket.getTicketStatus()) + "," +
                escapeCsv(ticket.getPriority()) + "," +
                escapeCsv(ticket.getAssignedPerson()) + "," +
                escapeCsv(ticket.getRequestedTime().toString()) + "," +
                escapeCsv(ticket.getIntent()) + "," +
                escapeCsv(ticket.getItComment()) + "," +
                escapeCsv(ticket.getClientIpAddress()) + "," +
                escapeCsv(ticket.getComputerName()) + "," +
                escapeCsv(ticket.getUserAgent())
            );
        }
    }
    
    private String escapeCsv(String field) {
        if (field == null) {
            return "";
        }
        // Escape quotes and wrap in quotes if contains comma, newline, or quote
        if (field.contains(",") || field.contains("\"") || field.contains("\n") || field.contains("\r")) {
            return "\"" + field.replace("\"", "\"\"") + "\"";
        }
        return field;
    }
}