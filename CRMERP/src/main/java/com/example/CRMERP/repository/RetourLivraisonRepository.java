package com.example.CRMERP.repository;

import com.example.CRMERP.entity.RetourLivraison;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RetourLivraisonRepository extends JpaRepository<RetourLivraison, Long> {
    List<RetourLivraison> findByLivraisonEntrepriseIdOrderByDateRetourDesc(Long entrepriseId);

    List<RetourLivraison> findAllByOrderByDateRetourDesc();
}
