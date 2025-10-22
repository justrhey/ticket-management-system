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
    
    @GetMapping("/ticket")
    public String ticket(HttpSession session) {
        if (session.getAttribute("user") == null) {
            return "redirect:/login";
        }
        return "forward:/ticket.html";
    }

    @GetMapping("/dashboard")
    public String  dashboard(HttpSession session){
        if(session.getAttribute("user") == null){
            return "redirect:/login";
        }
        return "forward:/dashboard.html";
    }
    
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
                
                // Store comprehensive user info in session
                session.setAttribute("user", user); // Store entire user object
                session.setAttribute("authenticated", true);
                session.setAttribute("userEmail", user.getEmail());
                session.setAttribute("userRole", user.getRole());
                session.setAttribute("userId", user.getId());
                session.setAttribute("userFullName", user.getFullName());
                
                // Optional: Role-based redirection
                if (user.isAdmin()) {
                    return "redirect:/ticket";
                }
                
                return "redirect:/";
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