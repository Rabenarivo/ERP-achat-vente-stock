import { useContext, useEffect, useMemo, useState } from "react";
import { getAcceptedProformas } from "../../api/proformaApi";
import { createLivraison } from "../../api/livraisonApi";
import { MiniBarChart, StatGrid, formatMga } from "../../components/StatsWidgets";
import { AuthContext } from "../../context/AuthContext";

export default function Type80AcceptedPage() {
  const { user } = useContext(AuthContext);
  const [proformas, setProformas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedProforma, setSelectedProforma] = useState(null);
  const [formData, setFormData] = useState({
    reference: "",
    date_livraison: "",
    commentaire: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const loadAccepted = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await getAcceptedProformas();
        setProformas(Array.isArray(response.data) ? response.data : []);
      } catch (loadError) {
        setError("Impossible de charger les proformas acceptees.");
      } finally {
        setLoading(false);
      }
    };

    loadAccepted();
  }, []);

  const totalBudget = useMemo(
    () => proformas.reduce((sum, proforma) => sum + Number(proforma?.prix || 0), 0),
    [proformas]
  );

  const proformasByFournisseur = useMemo(() => {
    const counter = new Map();
    proformas.forEach((proforma) => {
      const fournisseur =
        proforma?.fournisseur?.nom || `Fournisseur ${proforma?.fournisseur?.id || "N/A"}`;
      counter.set(fournisseur, (counter.get(fournisseur) || 0) + 1);
    });

    return Array.from(counter.entries()).map(([label, value]) => ({ label, value }));
  }, [proformas]);

  const stats = [
    { label: "Proformas acceptees", value: proformas.length },
    { label: "Budget accepte", value: formatMga(totalBudget) },
    { label: "Fournisseurs", value: proformasByFournisseur.length },
  ];

  const openLivraisonModal = (proforma) => {
    setSelectedProforma(proforma);
    setFormData({
      reference: `LIV-${proforma.id}-${Date.now()}`,
      date_livraison: new Date().toISOString().split("T")[0],
      commentaire: "",
    });
    setShowModal(true);
  };

  const closeLivraisonModal = () => {
    setShowModal(false);
    setSelectedProforma(null);
    setFormData({
      reference: "",
      date_livraison: "",
      commentaire: "",
    });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateLivraison = async () => {
    if (!selectedProforma) return;

    try {
      setSubmitting(true);
      setError("");

      if (!user?.id) {
        setError("Utilisateur non connecté.");
        setSubmitting(false);
        return;
      }

      const payload = {
        idProforma: selectedProforma.id,
        reference: formData.reference,
        date_livraison: formData.date_livraison + "T00:00:00",
        commentaire: formData.commentaire,
      };

      const response = await createLivraison(payload, user.id);

      if (response.data.success) {
        setSuccessMsg(`Livraison créée: ${response.data.message}`);
        setTimeout(() => setSuccessMsg(""), 3000);
        closeLivraisonModal();
      } else {
        setError(response.data.message || "Erreur lors de la création");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Erreur serveur");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-card">
      <div className="page-card__header">
        <div>
          <p className="page-eyebrow">Score 80</p>
          <h2>Liste des Proformas Acceptees</h2>
        </div>
        <p className="page-muted">API: /api/proforma/accepte</p>
      </div>

      {error ? <div className="alert alert-warning page-alert">{error}</div> : null}
      {successMsg ? <div className="alert alert-success page-alert">{successMsg}</div> : null}

      <StatGrid items={stats} />

      <MiniBarChart
        title="Proformas acceptees par fournisseur"
        data={proformasByFournisseur}
        emptyLabel="Aucune proforma acceptee pour le moment."
      />

      <div className="table-responsive">
        <table className="table table-striped table-bordered">
          <thead>
            <tr>
              <th>ID</th>
              <th>Demande</th>
              <th>Fournisseur</th>
              <th>Prix</th>
              <th>Delai</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="text-center">Chargement...</td>
              </tr>
            ) : proformas.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center">Aucune proforma acceptee.</td>
              </tr>
            ) : (
              proformas.map((proforma) => (
                <tr key={proforma.id}>
                  <td>{proforma.id}</td>
                  <td>{proforma.demande?.id || "-"}</td>
                  <td>{proforma.fournisseur?.nom || `ID ${proforma.fournisseur?.id || "-"}`}</td>
                  <td>{proforma.prix ?? "-"}</td>
                  <td>{proforma.delai ?? "-"}</td>
                  <td>{proforma.statut || "-"}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => openLivraisonModal(proforma)}
                    >
                      Créer Livraison
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Livraison */}
      {showModal && (
        <div className="modal-overlay" onClick={closeLivraisonModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Créer Livraison</h3>
              <button type="button" className="close" onClick={closeLivraisonModal}>
                &times;
              </button>
            </div>

            <div className="modal-body">
              {selectedProforma && (
                <div className="form-group mb-3">
                  <label className="form-label">Proforma:</label>
                  <div className="alert alert-info">
                    ID: {selectedProforma.id} | Fournisseur: {selectedProforma.fournisseur?.nom} | Prix: {selectedProforma.prix}
                  </div>
                </div>
              )}

              <div className="form-group mb-3">
                <label className="form-label">Référence:</label>
                <input
                  type="text"
                  className="form-control"
                  name="reference"
                  value={formData.reference}
                  onChange={handleFormChange}
                  placeholder="Ex: LIV-001"
                />
              </div>

              <div className="form-group mb-3">
                <label className="form-label">Date de Livraison:</label>
                <input
                  type="date"
                  className="form-control"
                  name="date_livraison"
                  value={formData.date_livraison}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className="form-group mb-3">
                <label className="form-label">Commentaire:</label>
                <textarea
                  className="form-control"
                  name="commentaire"
                  value={formData.commentaire}
                  onChange={handleFormChange}
                  rows="3"
                  placeholder="Ajouter un commentaire..."
                />
              </div>

              {error && <div className="alert alert-danger">{error}</div>}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={closeLivraisonModal}
                disabled={submitting}
              >
                Annuler
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleCreateLivraison}
                disabled={submitting}
              >
                {submitting ? "Création..." : "Créer Livraison"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
