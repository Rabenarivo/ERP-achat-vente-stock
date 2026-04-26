package com.example.CRMERP.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

@Entity
@Table(name = "retour_livraison_lignes")
public class RetourLivraisonLigne {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "retour_id", nullable = false)
    @JsonIgnoreProperties({"user", "department"})
    private RetourLivraison retour;

    @ManyToOne
    @JoinColumn(name = "livraison_lot_id", nullable = false)
    @JsonIgnoreProperties({"livraison"})
    private LivraisonLot livraisonLot;

    @ManyToOne
    @JoinColumn(name = "produit_id", nullable = false)
    @JsonIgnoreProperties({"stockMovements", "department"})
    private Produit produit;

    private String motif;

    @Column(name = "quantite_retour")
    private Integer quantiteRetour;

    @Column(name = "decision_stock")
    private String decisionStock;

    private String commentaire;

    @PrePersist
    public void prePersist() {
        if (decisionStock == null || decisionStock.isBlank()) {
            decisionStock = "QUARANTAINE";
        }
        if (motif == null || motif.isBlank()) {
            motif = "AUTRE";
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public RetourLivraison getRetour() {
        return retour;
    }

    public void setRetour(RetourLivraison retour) {
        this.retour = retour;
    }

    public LivraisonLot getLivraisonLot() {
        return livraisonLot;
    }

    public void setLivraisonLot(LivraisonLot livraisonLot) {
        this.livraisonLot = livraisonLot;
    }

    public Produit getProduit() {
        return produit;
    }

    public void setProduit(Produit produit) {
        this.produit = produit;
    }

    public String getMotif() {
        return motif;
    }

    public void setMotif(String motif) {
        this.motif = motif;
    }

    public Integer getQuantiteRetour() {
        return quantiteRetour;
    }

    public void setQuantiteRetour(Integer quantiteRetour) {
        this.quantiteRetour = quantiteRetour;
    }

    public String getDecisionStock() {
        return decisionStock;
    }

    public void setDecisionStock(String decisionStock) {
        this.decisionStock = decisionStock;
    }

    public String getCommentaire() {
        return commentaire;
    }

    public void setCommentaire(String commentaire) {
        this.commentaire = commentaire;
    }
}
