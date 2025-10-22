package com.schnitzel.ticketingsystem.userauth;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    // Simple login validation - plain text comparison
    public boolean validateUser(String email, String rawPassword) {
        System.out.println("=== VALIDATING USER ===");
        System.out.println("Email: " + email);
        System.out.println("Password: " + rawPassword);
        
        Optional<User> userOpt = userRepository.findByEmail(email);
        
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            System.out.println("User found: " + user.getEmail());
            System.out.println("Stored password: " + user.getPassword());
            
            boolean matches = rawPassword.equals(user.getPassword());
            System.out.println("Password matches: " + matches);
            return matches;
        } else {
            System.out.println("User not found");
            return false;
        }
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    // Create user - store plain text password
    public User createUser(String email, String rawPassword, String fullName, String position, UserRole role) {
        User user = new User(email, rawPassword, fullName, position, role);
        return userRepository.save(user);
    }

    // Get all users
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // Search users
    public List<User> searchUsers(String query) {
        return userRepository.searchUsers(query);
    }

    // Get user by ID
    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    // Update user - plain text password
    public User updateUser(Long id, User updatedUser) {
        return userRepository.findById(id)
                .map(user -> {
                    user.setEmail(updatedUser.getEmail());
                    if (updatedUser.getPassword() != null && !updatedUser.getPassword().isEmpty()) {
                        user.setPassword(updatedUser.getPassword()); // Store plain text
                    }
                    user.setFullName(updatedUser.getFullName());
                    user.setPosition(updatedUser.getPosition());
                    user.setRole(updatedUser.getRole());
                    return userRepository.save(user);
                }).orElseThrow(() -> new RuntimeException("User not found"));
    }

    // Delete user
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }
}