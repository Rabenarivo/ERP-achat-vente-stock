package com.example.CRMERP.repository;

import com.example.CRMERP.entity.LivraisonLot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LivraisonLotRepository extends JpaRepository<LivraisonLot, Long> {
    List<LivraisonLot> findByLivraisonIdOrderByDateCreationDesc(Long livraisonId);

    List<LivraisonLot> findByLivraisonEntrepriseIdOrderByDateCreationDesc(Long entrepriseId);
}
