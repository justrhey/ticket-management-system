package com.schnitzel.ticketingsystem.controller;

import com.schnitzel.ticketingsystem.userauth.User;
import com.schnitzel.ticketingsystem.userauth.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import jakarta.servlet.http.HttpSession;
import java.util.Optional;

@Controller
public class WebController {
    
    @Autowired
    private UserService userService;
    
    @GetMapping("/")
    public String index() {
        return "forward:/index.html";
    }
    
    @GetMapping("/dashboard")
    public String dashboard(HttpSession session) {
        if (session.getAttribute("user") == null) {
            return "redirect:/login";
        }
        return "forward:/ticket.html";
    } // <- Missing closing brace was here
    
    @GetMapping("/login")
    public String loginPage() {
        return "forward:/logIn.html";
    }
    
    @PostMapping("/login")
    public String login(@RequestParam String email,
                       @RequestParam String password, 
                       HttpSession session) {
        
        try {
            System.out.println("Login attempt for: " + email);
            
            if (userService.validateUser(email, password)) {
                Optional<User> userOpt = userService.findByEmail(email);
                if (userOpt.isPresent()) {
                    User user = userOpt.get();
                    session.setAttribute("user", user.getEmail());
                    session.setAttribute("authenticated", true);
                    return "redirect:/dashboard";
                }
            }
            
            return "redirect:/login?error=true";
            
        } catch (Exception e) {
            System.out.println("Login error: " + e.getMessage());
            e.printStackTrace();
            return "redirect:/login?error=true";
        }
    }
}