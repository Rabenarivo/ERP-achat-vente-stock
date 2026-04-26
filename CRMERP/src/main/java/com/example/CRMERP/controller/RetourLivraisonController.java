package com.example.CRMERP.controller;

import com.example.CRMERP.entity.LivraisonLot;
import com.example.CRMERP.entity.RetourLivraison;
import com.example.CRMERP.service.RetourLivraisonService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "http://localhost:3000")
@RequestMapping("/api/retours-livraison")
public class RetourLivraisonController {

    private final RetourLivraisonService service;

    public RetourLivraisonController(RetourLivraisonService service) {
        this.service = service;
    }

    @GetMapping("/entreprise")
    public ResponseEntity<?> getEntrepriseRetours(@RequestParam("userId") Long connectedUserId) {
        List<RetourLivraison> retours = service.findByEnterprise(connectedUserId);
        return ResponseEntity.ok(Map.of(
            "success", true,
            "data", retours
        ));
    }

    @GetMapping("/livraison/{livraisonId}/lots")
    public ResponseEntity<?> getLotsByLivraison(
        @PathVariable Long livraisonId,
        @RequestParam("userId") Long connectedUserId
    ) {
        List<LivraisonLot> lots = service.getLotsByLivraison(livraisonId, connectedUserId);
        return ResponseEntity.ok(Map.of(
            "success", true,
            "data", lots
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getRetourDetail(
        @PathVariable Long id,
        @RequestParam("userId") Long connectedUserId
    ) {
        return ResponseEntity.ok(Map.of(
            "success", true,
            "data", service.getDetail(id, connectedUserId)
        ));
    }

    @PostMapping("/save")
    public ResponseEntity<?> save(@RequestBody Map<String, Object> request) {
        return ResponseEntity.ok(Map.of(
            "success", true,
            "data", service.createRetour(request)
        ));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        return ResponseEntity.ok(Map.of(
            "success", true,
            "data", service.updateStatus(id, request)
        ));
    }
}
