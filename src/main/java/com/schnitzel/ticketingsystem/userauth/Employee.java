package com.schnitzel.ticketingsystem.userauth;

import jakarta.persistence.*;

@Entity
@Table(name = "employee")
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;
    
    public Employee() {
    }
    
    public Employee(String name) {
        this.name = name;
    }
    
    // Getters and setters
    public Long getId() { 
        return id;
    }
    
    public void setId(Long id) { 
        this.id = id; 
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }

    @Override
    public String toString() {
        return "Employee{" +
                "id=" + id +
                ", name='" + name + '\'' +
                '}';
    }
}