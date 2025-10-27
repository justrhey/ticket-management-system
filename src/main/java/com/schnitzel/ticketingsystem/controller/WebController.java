package com.schnitzel.ticketingsystem.controller;

import com.schnitzel.ticketingsystem.userauth.User;
import com.schnitzel.ticketingsystem.userauth.UserService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class WebController {

    @Autowired
    private UserService userService;

    @GetMapping("/")
    public String index() {
        // PUBLIC - This is the main index page
        return "forward:/index.html";
    }

    @GetMapping("/login")
    public String loginPage(HttpSession session) {
        // If already logged in, redirect to dashboard
        if (session.getAttribute("user") != null) {
            return "redirect:/dashboard";
        }
        return "forward:/logIn.html";
    }

    @PostMapping("/login")
    public String login(@RequestParam String email, 
                       @RequestParam String password, 
                       HttpSession session) {
        
        System.out.println("=== LOGIN ATTEMPT ===");
        System.out.println("Email: " + email);
        System.out.println("Password: " + password);
        
        if (userService.validateUser(email, password)) {
            User user = userService.findByEmail(email).get();
            session.setAttribute("user", user);
            session.setAttribute("userId", user.getId());
            session.setAttribute("userEmail", user.getEmail());
            System.out.println("LOGIN SUCCESS: " + user.getEmail());
            return "redirect:/dashboard";
        } else {
            System.out.println("LOGIN FAILED");
            return "redirect:/login?error=true";
        }
    }

    @GetMapping("/dashboard")
    public String dashboard(HttpSession session) {
        // Check if user is logged in
        if (session.getAttribute("user") == null) {
            return "redirect:/login";
        }
        return "forward:/dashboard.html";
    }

    @GetMapping("/tickets")
    public String tickets(HttpSession session) {
        // PROTECTED - Check if user is logged in
        if (session.getAttribute("user") == null) {
            return "redirect:/login";
        }
        return "forward:/ticket.html";
    }

    @GetMapping("/check-auth")
    public ResponseEntity<?> checkAuth(HttpSession session) {
        if (session.getAttribute("user") == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok().build();
    }

    @GetMapping("/user-info")
    public ResponseEntity<?> getUserInfo(HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(user);
    }

    @PostMapping("/logout")
    public String logout(HttpSession session) {
        session.invalidate();
        return "redirect:/";
    }
}