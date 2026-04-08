package com.example.CRMERP.controller;

import com.example.CRMERP.entity.WorkflowLog;
import com.example.CRMERP.entity.User;
import com.example.CRMERP.entity.Department;
import com.example.CRMERP.entity.DemandeAchat;
import com.example.CRMERP.service.WorkflowLogService;
import com.example.CRMERP.service.UserService;
import com.example.CRMERP.service.DepartmentService;
import com.example.CRMERP.service.DemandeAchatService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;


@RestController
@RequestMapping("/api/workflow-logs")
public class WorkflowLogControlle {

    private final WorkflowLogService service;
    private final DemandeAchatService demandeService;
    private final UserService userService;
    private final DepartmentService departmentService;
    private final WorkflowLogService workflowService;


    public WorkflowLogControlle(WorkflowLogService service, DemandeAchatService demandeService, UserService userService, DepartmentService departmentService) {
        this.service = service;
        this.workflowService = service;
        this.demandeService = demandeService;
        this.userService = userService;
        this.departmentService = departmentService;
    }

@PostMapping("/demandes-achat")
public ResponseEntity<?> createDemande(@RequestBody Map<String, Object> request) {

    try {
        String produit = request.get("produit").toString();
        Integer quantite = Integer.valueOf(request.get("quantite").toString());
        Long userId = Long.valueOf(request.get("userId").toString());
        User user = userService.findById(userId);
        if (user == null) {
            return ResponseEntity.badRequest().body("User not found");
        }
        DemandeAchat demande = new DemandeAchat();
        demande.setProduit(produit);
        demande.setQuantite(quantite);
        demande.setUser(user);
        demande.setDepartment(user.getDepartment());
        demande.setStatut("EN_COURS");

        DemandeAchat saved = demandeService.save(demande);

        WorkflowLog log = new WorkflowLog();
        log.setDemande(saved);
        log.setUser(user);
        log.setDepartment(user.getDepartment());
        log.setAction("CREATION_DEMANDE");
        log.setCommentaire("Création automatique");

        workflowService.save(log);
        

        return ResponseEntity.ok(saved);

    } catch (Exception e) {
        return ResponseEntity.badRequest().body(e.getMessage());
    }
}
    
    
}
