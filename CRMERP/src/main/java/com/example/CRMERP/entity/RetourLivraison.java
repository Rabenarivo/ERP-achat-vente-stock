package com.example.CRMERP.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "retours_livraison")
public class RetourLivraison {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "livraison_id", nullable = false)
    @JsonIgnoreProperties({"commande", "proforma", "user", "entreprise"})
    private Livraison livraison;

    private String reference;

    private String statut;

    @Column(name = "motif_global")
    private String motifGlobal;

    private String commentaire;

    @Column(name = "date_retour")
    private LocalDateTime dateRetour;

    @ManyToOne
    @JoinColumn(name = "user_id")
    @JsonIgnoreProperties({"password", "roles", "department", "entreprise"})
    private User user;

    @ManyToOne
    @JoinColumn(name = "department_id")
    private Department department;

    @PrePersist
    public void prePersist() {
        if (dateRetour == null) {
            dateRetour = LocalDateTime.now();
        }
        if (statut == null || statut.isBlank()) {
            statut = "BROUILLON";
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Livraison getLivraison() {
        return livraison;
    }

    public void setLivraison(Livraison livraison) {
        this.livraison = livraison;
    }

    public String getReference() {
        return reference;
    }

    public void setReference(String reference) {
        this.reference = reference;
    }

    public String getStatut() {
        return statut;
    }

    public void setStatut(String statut) {
        this.statut = statut;
    }

    public String getMotifGlobal() {
        return motifGlobal;
    }

    public void setMotifGlobal(String motifGlobal) {
        this.motifGlobal = motifGlobal;
    }

    public String getCommentaire() {
        return commentaire;
    }

    public void setCommentaire(String commentaire) {
        this.commentaire = commentaire;
    }

    public LocalDateTime getDateRetour() {
        return dateRetour;
    }

    public void setDateRetour(LocalDateTime dateRetour) {
        this.dateRetour = dateRetour;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Department getDepartment() {
        return department;
    }

    public void setDepartment(Department department) {
        this.department = department;
    }
}
