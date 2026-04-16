package com.example.CRMERP.service;

import com.example.CRMERP.entity.Facture;
import com.example.CRMERP.repository.FactureRepository;
import org.springframework.stereotype.Service;

@Service
public class FactureService {
    private final FactureRepository factureRepository;

    public FactureService(FactureRepository factureRepository) {
        this.factureRepository = factureRepository;
    }

    public Facture save(Facture facture) {
        return factureRepository.save(facture);
    }
}
