package com.example.CRMERP.service;

import com.example.CRMERP.entity.Livraison;
import com.example.CRMERP.entity.LivraisonLot;
import com.example.CRMERP.entity.Produit;
import com.example.CRMERP.entity.RetourLivraison;
import com.example.CRMERP.entity.RetourLivraisonLigne;
import com.example.CRMERP.entity.StockMovement;
import com.example.CRMERP.entity.User;
import com.example.CRMERP.entity.WorkflowLog;
import com.example.CRMERP.repository.LivraisonLotRepository;
import com.example.CRMERP.repository.LivraisonRepository;
import com.example.CRMERP.repository.ProduitRepository;
import com.example.CRMERP.repository.RetourLivraisonLigneRepository;
import com.example.CRMERP.repository.RetourLivraisonRepository;
import com.example.CRMERP.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class RetourLivraisonService {

    private final RetourLivraisonRepository retourRepository;
    private final RetourLivraisonLigneRepository ligneRepository;
    private final LivraisonRepository livraisonRepository;
    private final LivraisonLotRepository livraisonLotRepository;
    private final UserRepository userRepository;
    private final ProduitRepository produitRepository;
    private final StockMouvementService stockMouvementService;
    private final WorkflowLogService workflowLogService;

    public RetourLivraisonService(
        RetourLivraisonRepository retourRepository,
        RetourLivraisonLigneRepository ligneRepository,
        LivraisonRepository livraisonRepository,
        LivraisonLotRepository livraisonLotRepository,
        UserRepository userRepository,
        ProduitRepository produitRepository,
        StockMouvementService stockMouvementService,
        WorkflowLogService workflowLogService
    ) {
        this.retourRepository = retourRepository;
        this.ligneRepository = ligneRepository;
        this.livraisonRepository = livraisonRepository;
        this.livraisonLotRepository = livraisonLotRepository;
        this.userRepository = userRepository;
        this.produitRepository = produitRepository;
        this.stockMouvementService = stockMouvementService;
        this.workflowLogService = workflowLogService;
    }

    public List<RetourLivraison> findByEnterprise(Long userId) {
        User user = getUser(userId);
        if (user.getEntreprise() == null) {
            return retourRepository.findAllByOrderByDateRetourDesc();
        }
        return retourRepository.findByLivraisonEntrepriseIdOrderByDateRetourDesc(user.getEntreprise().getId());
    }

    public List<LivraisonLot> getLotsByLivraison(Long livraisonId, Long userId) {
        User user = getUser(userId);
        Livraison livraison = livraisonRepository.findById(livraisonId)
            .orElseThrow(() -> new IllegalArgumentException("Livraison introuvable: " + livraisonId));

        checkLivraisonAccess(user, livraison);

        return livraisonLotRepository.findByLivraisonIdOrderByDateCreationDesc(livraisonId);
    }

    public Map<String, Object> getDetail(Long retourId, Long userId) {
        User user = getUser(userId);
        RetourLivraison retour = retourRepository.findById(retourId)
            .orElseThrow(() -> new IllegalArgumentException("Retour introuvable: " + retourId));

        checkLivraisonAccess(user, retour.getLivraison());

        List<RetourLivraisonLigne> lignes = ligneRepository.findByRetourIdOrderByIdAsc(retourId);
        return Map.of(
            "retour", retour,
            "lignes", lignes
        );
    }

    @Transactional
    public Map<String, Object> createRetour(Map<String, Object> request) {
        Object userIdObj = request.get("userId");
        Object livraisonIdObj = request.get("livraisonId");
        Object lignesObj = request.get("lignes");

        if (userIdObj == null) {
            throw new IllegalArgumentException("userId est obligatoire.");
        }
        if (livraisonIdObj == null) {
            throw new IllegalArgumentException("livraisonId est obligatoire.");
        }
        if (!(lignesObj instanceof List<?> lignesList) || lignesList.isEmpty()) {
            throw new IllegalArgumentException("Au moins une ligne de retour est obligatoire.");
        }

        Long userId = Long.parseLong(userIdObj.toString());
        Long livraisonId = Long.parseLong(livraisonIdObj.toString());

        User user = getUser(userId);
        Livraison livraison = livraisonRepository.findById(livraisonId)
            .orElseThrow(() -> new IllegalArgumentException("Livraison introuvable: " + livraisonId));

        checkLivraisonAccess(user, livraison);

        if (!"LIVREE".equalsIgnoreCase(String.valueOf(livraison.getStatut()))) {
            throw new IllegalArgumentException("La livraison doit etre LIVREE avant un retour.");
        }

        RetourLivraison retour = new RetourLivraison();
        retour.setLivraison(livraison);
        retour.setReference(request.get("reference") != null && !String.valueOf(request.get("reference")).isBlank()
            ? String.valueOf(request.get("reference"))
            : "RET-" + livraison.getId() + "-" + System.currentTimeMillis());
        retour.setStatut("DEMANDE");
        retour.setMotifGlobal(request.get("motifGlobal") != null ? String.valueOf(request.get("motifGlobal")) : null);
        retour.setCommentaire(request.get("commentaire") != null ? String.valueOf(request.get("commentaire")) : null);
        retour.setUser(user);
        retour.setDepartment(user.getDepartment());
        RetourLivraison savedRetour = retourRepository.save(retour);

        List<RetourLivraisonLigne> createdLignes = new ArrayList<>();
        for (Object obj : lignesList) {
            if (!(obj instanceof Map<?, ?> lineMapRaw)) {
                throw new IllegalArgumentException("Format de ligne invalide.");
            }

            Long lotId = lineMapRaw.get("livraisonLotId") != null
                ? Long.parseLong(String.valueOf(lineMapRaw.get("livraisonLotId")))
                : null;
            if (lotId == null) {
                throw new IllegalArgumentException("livraisonLotId est obligatoire pour chaque ligne.");
            }

            Integer quantiteRetour = lineMapRaw.get("quantiteRetour") != null
                ? Integer.parseInt(String.valueOf(lineMapRaw.get("quantiteRetour")))
                : 0;
            if (quantiteRetour <= 0) {
                throw new IllegalArgumentException("quantiteRetour doit etre > 0.");
            }

            LivraisonLot lot = livraisonLotRepository.findById(lotId)
                .orElseThrow(() -> new IllegalArgumentException("Lot introuvable: " + lotId));

            if (!lot.getLivraison().getId().equals(livraison.getId())) {
                throw new IllegalArgumentException("Le lot " + lotId + " n'appartient pas a la livraison.");
            }

            int dejaRetournee = lot.getQuantiteRetournee() == null ? 0 : lot.getQuantiteRetournee();
            int quantiteLivree = lot.getQuantiteLivree() == null ? 0 : lot.getQuantiteLivree();
            if (dejaRetournee + quantiteRetour > quantiteLivree) {
                throw new IllegalArgumentException("Retour depasse la quantite livree pour le lot: " + lot.getLotReference());
            }

            RetourLivraisonLigne ligne = new RetourLivraisonLigne();
            ligne.setRetour(savedRetour);
            ligne.setLivraisonLot(lot);
            ligne.setProduit(lot.getProduit());
            ligne.setMotif(lineMapRaw.get("motif") != null ? String.valueOf(lineMapRaw.get("motif")) : "AUTRE");
            ligne.setQuantiteRetour(quantiteRetour);
            ligne.setDecisionStock(lineMapRaw.get("decisionStock") != null ? String.valueOf(lineMapRaw.get("decisionStock")) : "QUARANTAINE");
            ligne.setCommentaire(lineMapRaw.get("commentaire") != null ? String.valueOf(lineMapRaw.get("commentaire")) : null);
            createdLignes.add(ligneRepository.save(ligne));
        }

        WorkflowLog log = new WorkflowLog();
        log.setUser(user);
        log.setDepartment(user.getDepartment());
        log.setAction("RETOUR_LIVRAISON_DEMANDE");
        log.setCommentaire("Demande retour creee: " + savedRetour.getReference());
        workflowLogService.save(log);

        return Map.of(
            "retour", savedRetour,
            "lignes", createdLignes
        );
    }

    @Transactional
    public Map<String, Object> updateStatus(Long retourId, Map<String, Object> request) {
        Object userIdObj = request.get("userId");
        Object statutObj = request.get("statut");

        if (userIdObj == null) {
            throw new IllegalArgumentException("userId est obligatoire.");
        }
        if (statutObj == null) {
            throw new IllegalArgumentException("statut est obligatoire.");
        }

        Long userId = Long.parseLong(userIdObj.toString());
        String nouveauStatut = String.valueOf(statutObj).toUpperCase();

        if (!("DEMANDE".equals(nouveauStatut)
            || "VALIDE".equals(nouveauStatut)
            || "REFUSE".equals(nouveauStatut)
            || "CLOTURE".equals(nouveauStatut))) {
            throw new IllegalArgumentException("Statut non supporte: " + nouveauStatut);
        }

        User user = getUser(userId);
        RetourLivraison retour = retourRepository.findById(retourId)
            .orElseThrow(() -> new IllegalArgumentException("Retour introuvable: " + retourId));

        checkLivraisonAccess(user, retour.getLivraison());

        String currentStatus = String.valueOf(retour.getStatut()).toUpperCase();
        if ("CLOTURE".equals(currentStatus)) {
            throw new IllegalArgumentException("Retour deja cloture.");
        }

        List<RetourLivraisonLigne> lignes = ligneRepository.findByRetourIdOrderByIdAsc(retourId);

        if ("VALIDE".equals(nouveauStatut) && !"VALIDE".equals(currentStatus)) {
            applyStockImpacts(retour, lignes, user);
        }

        retour.setStatut(nouveauStatut);
        if (request.get("commentaire") != null) {
            String commentaire = String.valueOf(request.get("commentaire"));
            if (retour.getCommentaire() == null || retour.getCommentaire().isBlank()) {
                retour.setCommentaire(commentaire);
            } else {
                retour.setCommentaire(retour.getCommentaire() + " | " + commentaire);
            }
        }

        RetourLivraison saved = retourRepository.save(retour);

        WorkflowLog log = new WorkflowLog();
        log.setUser(user);
        log.setDepartment(user.getDepartment());
        log.setAction("RETOUR_LIVRAISON_" + nouveauStatut);
        log.setCommentaire("Retour " + saved.getReference() + " passe a " + nouveauStatut);
        workflowLogService.save(log);

        return Map.of(
            "retour", saved,
            "lignes", lignes
        );
    }

    private void applyStockImpacts(RetourLivraison retour, List<RetourLivraisonLigne> lignes, User user) {
        for (RetourLivraisonLigne ligne : lignes) {
            LivraisonLot lot = ligne.getLivraisonLot();
            Produit produit = ligne.getProduit();

            int q = ligne.getQuantiteRetour() == null ? 0 : ligne.getQuantiteRetour();
            if (q <= 0) {
                continue;
            }

            int lotRetourne = lot.getQuantiteRetournee() == null ? 0 : lot.getQuantiteRetournee();
            int lotLivree = lot.getQuantiteLivree() == null ? 0 : lot.getQuantiteLivree();
            if (lotRetourne + q > lotLivree) {
                throw new IllegalArgumentException("Quantite retour invalide pour lot " + lot.getLotReference());
            }

            String decision = String.valueOf(ligne.getDecisionStock()).toUpperCase();
            boolean needsOutFromAvailable = !"REINTEGRATION".equals(decision);

            if (needsOutFromAvailable) {
                int actuelDispo = produit.getStockDisponible() == null ? 0 : produit.getStockDisponible();
                int nouveauDispo = Math.max(0, actuelDispo - q);
                produit.setStockDisponible(nouveauDispo);
                produit.setStock(nouveauDispo);
            }

            if ("QUARANTAINE".equals(decision)) {
                int actuel = produit.getStockQuarantaine() == null ? 0 : produit.getStockQuarantaine();
                produit.setStockQuarantaine(actuel + q);
            } else if ("HS".equals(decision)) {
                int actuel = produit.getStockHs() == null ? 0 : produit.getStockHs();
                produit.setStockHs(actuel + q);
            }

            produitRepository.save(produit);

            lot.setQuantiteRetournee(lotRetourne + q);
            livraisonLotRepository.save(lot);

            StockMovement movement = new StockMovement();
            movement.setProduit(produit);
            movement.setType("RETOUR_LIVRAISON");
            movement.setQuantite(q);
            movement.setUser(user);
            movement.setSourceType("RETOUR_LIVRAISON");
            movement.setSourceId(retour.getId().intValue());
            movement.setEtatProduit(resolveEtatProduit(ligne.getMotif()));
            movement.setCommentaire("Retour lot " + lot.getLotReference() + " - decision " + decision);
            stockMouvementService.save(movement);
        }
    }

    private String resolveEtatProduit(String motif) {
        String normalized = String.valueOf(motif).toUpperCase();
        if ("HS".equals(normalized)) {
            return "HS";
        }
        if ("DEFECTUEUX".equals(normalized)) {
            return "DEFECTUEUX";
        }
        return "CONFORME";
    }

    private User getUser(Long userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable: " + userId));
    }

    private void checkLivraisonAccess(User user, Livraison livraison) {
        if (user.getEntreprise() == null) {
            return;
        }
        if (livraison.getEntreprise() == null || !user.getEntreprise().getId().equals(livraison.getEntreprise().getId())) {
            throw new IllegalArgumentException("Cette livraison appartient a une autre entreprise.");
        }
    }
}
