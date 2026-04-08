package com.example.CRMERP.controller;



import com.example.CRMERP.entity.DemandeAchat;
import com.example.CRMERP.service.DemandeAchatService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/demandes-achat")
public class DemandeAchatController {

    private final DemandeAchatService service;
    
    public DemandeAchatController(DemandeAchatService service) {
        this.service = service;
    }

    @GetMapping
    public List<DemandeAchat> getAll() {
        return service.findAll();
    }

    @PostMapping
    public DemandeAchat create(@RequestBody DemandeAchat d) {
        return service.save(d);
    }
    
    
}
