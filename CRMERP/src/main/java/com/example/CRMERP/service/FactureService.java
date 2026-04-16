package com.example.CRMERP.service;

import com.example.CRMERP.entity.Facture;
import com.example.CRMERP.entity.Proforma;
import com.example.CRMERP.entity.Fournisseur;
import com.example.CRMERP.repository.FactureRepository;
import com.example.CRMERP.repository.ProformaRepository;
import com.example.CRMERP.repository.FournisseurRepository;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class FactureService {
    private final FactureRepository factureRepository;
    private final ProformaRepository proformaRepository;
    private final FournisseurRepository fournisseurRepository;

    public FactureService (
        FactureRepository offFactureRepository,
        ProformaRepository proformaRepository,
        FournisseurRepository fournisseurRepository
    ){
        this.factureRepository = offFactureRepository;
        this.fournisseurRepository = fournisseurRepository;
        this.proformaRepository = proformaRepository;
    }

    public List<Facture> getAll() {
        return factureRepository.findAll();
    }

    
}
