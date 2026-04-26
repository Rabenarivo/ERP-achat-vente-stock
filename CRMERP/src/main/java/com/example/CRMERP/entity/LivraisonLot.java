package com.example.CRMERP.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "livraison_lots")
public class LivraisonLot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "livraison_id", nullable = false)
    @JsonIgnoreProperties({"commande", "proforma", "user", "entreprise"})
    private Livraison livraison;

    @ManyToOne
    @JoinColumn(name = "produit_id", nullable = false)
    @JsonIgnoreProperties({"stockMovements", "department"})
    private Produit produit;

    @Column(name = "lot_reference", nullable = false)
    private String lotReference;

    @Column(name = "quantite_livree", nullable = false)
    private Integer quantiteLivree;

    @Column(name = "quantite_retournee", nullable = false)
    private Integer quantiteRetournee = 0;

    @Column(name = "statut_qualite", nullable = false)
    private String statutQualite = "CONFORME";

    @Column(name = "date_creation", nullable = false)
    private LocalDateTime dateCreation;

    @PrePersist
    public void prePersist() {
        if (dateCreation == null) {
            dateCreation = LocalDateTime.now();
        }
        if (quantiteRetournee == null) {
            quantiteRetournee = 0;
        }
        if (statutQualite == null || statutQualite.isBlank()) {
            statutQualite = "CONFORME";
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

    public Produit getProduit() {
        return produit;
    }

    public void setProduit(Produit produit) {
        this.produit = produit;
    }

    public String getLotReference() {
        return lotReference;
    }

    public void setLotReference(String lotReference) {
        this.lotReference = lotReference;
    }

    public Integer getQuantiteLivree() {
        return quantiteLivree;
    }

    public void setQuantiteLivree(Integer quantiteLivree) {
        this.quantiteLivree = quantiteLivree;
    }

    public Integer getQuantiteRetournee() {
        return quantiteRetournee;
    }

    public void setQuantiteRetournee(Integer quantiteRetournee) {
        this.quantiteRetournee = quantiteRetournee;
    }

    public String getStatutQualite() {
        return statutQualite;
    }

    public void setStatutQualite(String statutQualite) {
        this.statutQualite = statutQualite;
    }

    public LocalDateTime getDateCreation() {
        return dateCreation;
    }

    public void setDateCreation(LocalDateTime dateCreation) {
        this.dateCreation = dateCreation;
    }
}
