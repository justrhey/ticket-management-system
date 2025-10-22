package com.schnitzel.ticketingsystem.userauth;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class UserService {
    
    @Autowired
    private UserRepository userRepository;
    
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    
    // Login validation method with BCrypt
    public boolean validateUser(String email, String password) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            // Use BCrypt to check the password
            return passwordEncoder.matches(password, user.getPassword());
        }
        return false;
    }
    
    // Find user by email
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }
    
    // Enhanced createUser method with password encoding
    public User createUser(User user) {
        // Hash the password before saving
        String hashedPassword = passwordEncoder.encode(user.getPassword());
        user.setPassword(hashedPassword);
        return userRepository.save(user);
    }
    
    // Method to update password with hashing
    public User updatePassword(Long userId, String newPassword) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            String hashedPassword = passwordEncoder.encode(newPassword);
            user.setPassword(hashedPassword);
            return userRepository.save(user);
        }
        return null;
    }
    
    // Method to register a new user with password hashing
    public User registerUser(String email, String password, String fullName, String position, UserRole role) {
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("User with this email already exists");
        }
        
        String hashedPassword = passwordEncoder.encode(password);
        User newUser = new User(email, hashedPassword, fullName, position, role);
        return userRepository.save(newUser);
    }
    
    // Check if raw password matches the hashed one
    public boolean checkPassword(String rawPassword, String hashedPassword) {
        return passwordEncoder.matches(rawPassword, hashedPassword);
    }
    
    // Hash a raw password (useful for admin resetting passwords)
    public String hashPassword(String rawPassword) {
        return passwordEncoder.encode(rawPassword);
    }
    
    // Your existing methods
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
    
    public List<User> searchUsers(String query) {
        if (query == null || query.trim().isEmpty()) {
            return userRepository.findAll();
        }
        return userRepository.searchUsers(query.trim());
    }
    
    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }
    
    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }
    
    public User updateUser(Long id, User userDetails) {
        Optional<User> userOptional = userRepository.findById(id);
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            user.setFullName(userDetails.getFullName());
            user.setEmail(userDetails.getEmail());
            user.setPosition(userDetails.getPosition());
            user.setRole(userDetails.getRole());
            // Note: Password is not updated here - use updatePassword method instead
            return userRepository.save(user);
        }
        return null;
    }
    
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }
    
    public boolean userExists(String email) {
        return userRepository.existsByEmail(email);
    }
}