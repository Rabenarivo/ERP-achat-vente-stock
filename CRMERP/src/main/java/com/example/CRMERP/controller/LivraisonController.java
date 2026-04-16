package com.example.CRMERP.controller;

import com.example.CRMERP.service.LivraisonService;
import com.example.CRMERP.entity.Livraison;
import com.example.CRMERP.entity.BonCommande;
import com.example.CRMERP.entity.Commande;
import com.example.CRMERP.entity.Proforma;
import com.example.CRMERP.entity.User;
import com.example.CRMERP.entity.WorkflowLog;
import com.example.CRMERP.repository.BonCommandeRepository;
import com.example.CRMERP.repository.CommandeRepository;
import com.example.CRMERP.repository.LivraisonRepository;
import com.example.CRMERP.repository.ProformaRepository;
import com.example.CRMERP.repository.UserRepository;
import com.example.CRMERP.service.WorkflowLogService;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;



@RestController
@RequestMapping("/api/livraisons")
public class LivraisonController {
    private final LivraisonService livraisonService;
    private final WorkflowLogService workflowLogService;
    private final CommandeRepository commandeRepository;
    private final ProformaRepository proformaRepository;
    private final BonCommandeRepository bonCommandeRepository;
    private final LivraisonRepository livraisonRepository;
    private final UserRepository userRepository;

    public LivraisonController(LivraisonService livraisonService,
        WorkflowLogService workflowLogService,
        CommandeRepository commandeRepository,
        ProformaRepository proformaRepository,
        BonCommandeRepository bonCommandeRepository,
        LivraisonRepository livraisonRepository,
        UserRepository userRepository) 
        {
        this.livraisonService = livraisonService;
        this.workflowLogService = workflowLogService;
        this.commandeRepository = commandeRepository;
        this.proformaRepository = proformaRepository;
        this.bonCommandeRepository = bonCommandeRepository;
        this.livraisonRepository = livraisonRepository;
        this.userRepository = userRepository;
        }

        @GetMapping("/entreprise")
        public ResponseEntity<?> getEntrepriseLivraisons(@RequestHeader("X-User-Id") Long connectedUserId) {
            try {
                User user = userRepository.findById(connectedUserId)
                    .orElseThrow(() -> new IllegalArgumentException("Utilisateur connecté introuvable: " + connectedUserId));

                if (user.getEntreprise() == null) {
                    return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Utilisateur non lié à une entreprise."
                    ));
                }

                List<Livraison> livraisons = livraisonRepository
                    .findByEntrepriseIdOrderByDateCreationDesc(user.getEntreprise().getId());

                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "enterprise", user.getEntreprise(),
                    "data", livraisons
                ));
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
                ));
            } catch (Exception e) {
                return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "message", "Erreur serveur: " + e.getMessage()
                ));
            }
        }

        @PostMapping("/save_livraison")
        public ResponseEntity<?> save(
            @RequestBody Map<String, Object> request,
            @RequestHeader("X-User-Id") Long connectedUserId
        ) {
            try {
                // Extract request parameters
                Object commandeIdObj = request.get("idCommande");
                Object proformaIdObj = request.get("idProforma");
                String reference = (String) request.get("reference");
                String date_livraison = (String) request.get("date_livraison");
                String commentaire = (String) request.get("commentaire");

                if (commandeIdObj == null && proformaIdObj == null) {
                    throw new IllegalArgumentException("idCommande ou idProforma est obligatoire.");
                }

                User user = userRepository.findById(connectedUserId)
                    .orElseThrow(() -> new IllegalArgumentException("Utilisateur connecté introuvable: " + connectedUserId));

                if (user.getEntreprise() == null) {
                    throw new IllegalArgumentException("Utilisateur non lié à une entreprise.");
                }

                Commande commande;

                // 1) Direct flow from existing commande
                if (commandeIdObj != null) {
                    Long commandeId = Long.parseLong(commandeIdObj.toString());
                    commande = commandeRepository.findById(commandeId)
                        .orElseThrow(() -> new IllegalArgumentException("Commande introuvable: " + commandeId));
                } else {
                    // 2) Flow from accepted proforma: ensure BC exists, then create commande
                    Long proformaId = Long.parseLong(proformaIdObj.toString());
                    Proforma proforma = proformaRepository.findById(proformaId)
                        .orElseThrow(() -> new IllegalArgumentException("Proforma introuvable: " + proformaId));

                    if (!"ACCEPTEE".equalsIgnoreCase(String.valueOf(proforma.getStatut()))) {
                        throw new IllegalArgumentException("La proforma doit être ACCEPTEE.");
                    }

                    BonCommande bonCommande = bonCommandeRepository
                        .findFirstByProformaIdOrderByDateDesc(proformaId)
                        .orElseThrow(() -> new IllegalArgumentException("Pas de bon de commande pour cette proforma."));

                    commande = new Commande();
                    commande.setClient(user.getEntreprise());
                    commande.setMontantTotal(proforma.getPrix());
                    commande.setDepartment(user.getDepartment());
                    commande = commandeRepository.save(commande);

                    if (reference == null || reference.isBlank()) {
                        reference = "LIV-BC-" + bonCommande.getId() + "-" + proformaId;
                    }
                }

                if (commande.getClient() == null) {
                    throw new IllegalArgumentException("Commande sans entreprise cliente.");
                }

                if (!commande.getClient().getId().equals(user.getEntreprise().getId())) {
                    throw new IllegalArgumentException("Cette commande appartient à une autre entreprise.");
                }

                // Create livraison with statut EN_COURS
                Livraison livraison = new Livraison();
                livraison.setCommande(commande);
                livraison.setReference(reference);
                livraison.setStatut("EN_COURS");  // Statut par défaut
                livraison.setDateLivraison(LocalDateTime.parse(date_livraison));
                livraison.setCommentaire(commentaire);
                livraison.setUser(user);
                livraison.setEntreprise(commande.getClient());

                // Save livraison
                Livraison saved = livraisonService.save(livraison);

                // Log workflow
                WorkflowLog workflowLog = new WorkflowLog();
                workflowLog.setUser(user);
                workflowLog.setDepartment(user.getDepartment());
                workflowLog.setAction("LIVRAISON_CREEE");
                workflowLog.setCommentaire("Livraison créée avec statut EN_COURS - Ref: " + reference);
                workflowLogService.save(workflowLog);

                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Livraison créée avec succès",
                    "data", saved,
                    "statut", "EN_COURS"
                ));
                
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Erreur: " + e.getMessage()
                ));
            } catch (Exception e) {
                return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "message", "Erreur serveur: " + e.getMessage()
                ));
            }
        }

        @PatchMapping("/{id}/assign")
        public ResponseEntity<?> assign(@PathVariable Long id, @RequestHeader("X-User-Id") Long connectedUserId) {
            try {
                Livraison livraison = livraisonRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Livraison introuvable: " + id));

                User user = userRepository.findById(connectedUserId)
                    .orElseThrow(() -> new IllegalArgumentException("Utilisateur connecté introuvable: " + connectedUserId));

                if (user.getEntreprise() == null) {
                    throw new IllegalArgumentException("Utilisateur non lié à une entreprise.");
                }

                if (livraison.getEntreprise() == null || !livraison.getEntreprise().getId().equals(user.getEntreprise().getId())) {
                    throw new IllegalArgumentException("Cette livraison appartient à une autre entreprise.");
                }

                livraison.setUser(user);
                livraison.setStatut("PRETE");
                Livraison saved = livraisonRepository.save(livraison);

                WorkflowLog workflowLog = new WorkflowLog();
                workflowLog.setUser(user);
                workflowLog.setDepartment(user.getDepartment());
                workflowLog.setAction("LIVRAISON_ASSIGNEE");
                workflowLog.setCommentaire("Livraison assignée à l'entreprise et marquée PRETE: " + saved.getReference());
                workflowLogService.save(workflowLog);

                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Livraison assignée avec succès",
                    "data", saved
                ));
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
                ));
            } catch (Exception e) {
                return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "message", "Erreur serveur: " + e.getMessage()
                ));
            }
        }

        @PatchMapping("/{id}/livree")
        public ResponseEntity<?> markLivree(@PathVariable Long id, @RequestHeader("X-User-Id") Long connectedUserId) {
            try {
                Livraison livraison = livraisonRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Livraison introuvable: " + id));

                User user = userRepository.findById(connectedUserId)
                    .orElseThrow(() -> new IllegalArgumentException("Utilisateur connecté introuvable: " + connectedUserId));

                if (user.getEntreprise() == null) {
                    throw new IllegalArgumentException("Utilisateur non lié à une entreprise.");
                }

                if (livraison.getEntreprise() == null || !livraison.getEntreprise().getId().equals(user.getEntreprise().getId())) {
                    throw new IllegalArgumentException("Cette livraison appartient à une autre entreprise.");
                }

                livraison.setStatut("LIVREE");
                Livraison saved = livraisonRepository.save(livraison);

                WorkflowLog workflowLog = new WorkflowLog();
                workflowLog.setUser(user);
                workflowLog.setDepartment(user.getDepartment());
                workflowLog.setAction("LIVRAISON_LIVREE");
                workflowLog.setCommentaire("Livraison marquée livree: " + saved.getReference());
                workflowLogService.save(workflowLog);

                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Livraison marquée LIVREE",
                    "data", saved
                ));
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
                ));
            } catch (Exception e) {
                return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "message", "Erreur serveur: " + e.getMessage()
                ));
            }
        }
        

}
