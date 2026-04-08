package com.example.CRMERP.service;

import com.example.CRMERP.entity.DemandeAchat;
import com.example.CRMERP.repository.DemandeAchatRepository;
import org.springframework.stereotype.Service;

import java.util.List;


public class DemandeAchatService {

        private final DemandeAchatRepository repo;

        public DemandeAchatService(DemandeAchatRepository repo) {
            this.repo = repo;
        }


        public List<DemandeAchat> findAll() {
            return repo.findAll();
        }

        public DemandeAchat save(DemandeAchat d) {
            return repo.save(d);
        }
}
