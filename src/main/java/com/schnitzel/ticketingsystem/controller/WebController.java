package com.schnitzel.ticketingsystem.controller;

import com.schnitzel.ticketingsystem.userauth.User;
import com.schnitzel.ticketingsystem.userauth.UserService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class WebController {

    @Autowired
    private UserService userService;

    @GetMapping("/login")
    public String loginPage() {
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
            System.out.println("LOGIN SUCCESS: " + user.getEmail());
            return "redirect:/dashboard";
        } else {
            System.out.println("LOGIN FAILED");
            return "redirect:/login?error=true";
        }
    }

    @GetMapping("/dashboard")
    public String dashboard() {
        return "forward:/dashboard.html";
    }

     @GetMapping("/tickets")
    public String tickets() {
        return "forward:/ticket.html";
    }


    @PostMapping("/logout")
    public String logout(HttpSession session) {
        session.invalidate();
        return "redirect:/login";
    }
}