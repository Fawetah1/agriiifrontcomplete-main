package com.example.usermanagementbackend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nom;
    private String prenom;
    private String email;
    private String motDePasse;
    private String role;
    private String numeroDeTelephone;
    private String adresseLivraison;
    private boolean isBlocked;
    private boolean verified;
    private String verificationCode;
    private String resetCode;
    private LocalDateTime derniereConnexion;
    private int nombreConnexions;
    private int actionsEffectuees;
    private int nombreBlocages;
    
    @Column(name = "photo")
    private String photo;

    // Getters and Setters for photo
    public String getPhoto() {
        return photo;
    }

    public void setPhoto(String photo) {
        this.photo = photo;
    }

    // ... rest of the existing code ...
} 