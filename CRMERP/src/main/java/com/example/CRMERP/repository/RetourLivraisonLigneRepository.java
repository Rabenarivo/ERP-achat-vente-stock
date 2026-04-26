package com.example.CRMERP.repository;

import com.example.CRMERP.entity.RetourLivraisonLigne;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RetourLivraisonLigneRepository extends JpaRepository<RetourLivraisonLigne, Long> {
    List<RetourLivraisonLigne> findByRetourIdOrderByIdAsc(Long retourId);
}
