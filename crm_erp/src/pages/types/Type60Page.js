import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { getEnterpriseLivraisons } from "../../api/livraisonApi";
import { createFactureFromLivraison, getEnterpriseFactures } from "../../api/factureApi";
import { MiniBarChart, StatGrid, formatMga } from "../../components/StatsWidgets";
import { generateFacturePdf } from "../../utils/facturePdf";

export default function Type60Page() {
  const { user } = useContext(AuthContext);
  const [livraisons, setLivraisons] = useState([]);
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [workingId, setWorkingId] = useState(null);
  const [exportingId, setExportingId] = useState(null);

  const loadData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      setError("Utilisateur non connecté.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [livraisonRes, factureRes] = await Promise.allSettled([
        getEnterpriseLivraisons(user.id),
        getEnterpriseFactures(user.id),
      ]);

      const livraisonData = livraisonRes.status === "fulfilled" ? livraisonRes.value?.data?.data : [];
      const factureData = factureRes.status === "fulfilled" ? factureRes.value?.data?.data : [];

      setLivraisons(Array.isArray(livraisonData) ? livraisonData : []);
      setFactures(Array.isArray(factureData) ? factureData : []);

      const livraisonError = livraisonRes.status === "rejected"
        ? livraisonRes.reason?.response?.data?.message || ""
        : "";
      const factureError = factureRes.status === "rejected"
        ? factureRes.reason?.response?.data?.message || ""
        : "";

      if (livraisonError || factureError) {
        setError([livraisonError, factureError].filter(Boolean).join(" | "));
      }
    } catch (loadError) {
      setError(loadError?.response?.data?.message || "Impossible de charger les donnees.");
      setLivraisons([]);
      setFactures([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const deliveryStats = useMemo(() => {
    const total = livraisons.length;
    const livrees = livraisons.filter((item) => String(item?.statut || "").toUpperCase() === "LIVREE").length;
    const enCours = livraisons.filter((item) => String(item?.statut || "").toUpperCase() === "EN_COURS").length;
    const brouillons = livraisons.filter((item) => String(item?.statut || "").toUpperCase() === "BROUILLON").length;

    return [
      { label: "Livraisons", value: total },
      { label: "Livrees", value: livrees },
      { label: "En cours", value: enCours },
      { label: "Brouillon", value: brouillons },
    ];
  }, [livraisons]);

  const deliveryChart = useMemo(() => {
    const counter = new Map();
    livraisons.forEach((livraison) => {
      const statut = String(livraison?.statut || "SANS_STATUT");
      counter.set(statut, (counter.get(statut) || 0) + 1);
    });
    return Array.from(counter.entries()).map(([label, value]) => ({ label, value }));
  }, [livraisons]);

  const factureStats = useMemo(() => {
    const total = factures.length;
    const emises = factures.filter((item) => String(item?.statut || "").toUpperCase() === "EMISE").length;
    const payees = factures.filter((item) => String(item?.statut || "").toUpperCase() === "PAYEE").length;
    const totalTtc = factures.reduce((sum, facture) => sum + Number(facture?.montantTtc || 0), 0);

    return [
      { label: "Factures", value: total },
      { label: "Emises", value: emises },
      { label: "Payees", value: payees },
      { label: "Total TTC", value: formatMga(totalTtc) },
    ];
  }, [factures]);

  const handleLivree = async (livraisonId) => {
    if (!user?.id) {
      setError("Utilisateur non connecté.");
      return;
    }

    try {
      setWorkingId(livraisonId);
      setMessage("");
      setError("");

      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL || "http://localhost:8080"}/api/livraisons/${livraisonId}/livree`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "X-User-Id": user.id,
          },
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Erreur lors du changement d'etat.");
      }

      setMessage(data?.message || "Livraison marquée livree.");
      await loadData();
    } catch (stateError) {
      setError(stateError.message || "Erreur lors du changement d'etat.");
    } finally {
      setWorkingId(null);
    }
  };

  const handleCreateFacture = async (livraisonId) => {
    if (!user?.id) {
      setError("Utilisateur non connecté.");
      return;
    }

    try {
      setWorkingId(livraisonId);
      setMessage("");
      setError("");

      const response = await createFactureFromLivraison({ livraisonId }, user.id);
      const createdFacture = response?.data?.data;
      setMessage(response?.data?.message || "Facture créée.");

      if (createdFacture) {
        generateFacturePdf(createdFacture, user?.entreprise?.nom || "Entreprise");
      }

      await loadData();
    } catch (invoiceError) {
      setError(invoiceError?.response?.data?.message || "Erreur lors de la création de facture.");
    } finally {
      setWorkingId(null);
    }
  };

  const handleExportFacture = async (facture) => {
    try {
      setExportingId(facture.id);
      setMessage("");
      setError("");

      generateFacturePdf(facture, user?.entreprise?.nom || "Entreprise");
      setMessage(`PDF exporte pour la facture ${facture.reference || facture.id}.`);
    } catch (exportError) {
      setError(exportError?.message || "Erreur lors de l'export PDF.");
    } finally {
      setExportingId(null);
    }
  };

  return (
    <div className="page-card">
      <div className="page-card__header">
        <div>
          <p className="page-eyebrow">Score 60</p>
          <h2>Gestion Livraison et Facturation</h2>
        </div>
        <p className="page-muted">Changement d'etat livraison puis creation facture.</p>
      </div>

      {message ? <div className="alert alert-success page-alert">{message}</div> : null}
      {error ? <div className="alert alert-warning page-alert">{error}</div> : null}

      <StatGrid items={deliveryStats} />
      <MiniBarChart
        title="Livraisons par statut"
        data={deliveryChart}
        emptyLabel="Aucune livraison disponible."
      />

      <div className="table-responsive">
        <table className="table table-striped table-bordered">
          <thead>
            <tr>
              <th>ID</th>
              <th>Reference</th>
              <th>Commande</th>
              <th>Entreprise</th>
              <th>Date</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="text-center">Chargement...</td>
              </tr>
            ) : livraisons.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center">Aucune livraison trouvee pour cette entreprise.</td>
              </tr>
            ) : (
              livraisons.map((livraison) => {
                const statut = String(livraison?.statut || "").toUpperCase();
                const canMarkLivree = statut === "BROUILLON" || statut === "EN_COURS";
                const canCreateFacture = statut === "LIVREE";

                return (
                  <tr key={livraison.id}>
                    <td>{livraison.id}</td>
                    <td>{livraison.reference || "-"}</td>
                    <td>{livraison.commande?.id || "-"}</td>
                    <td>{livraison.entreprise?.nom || "-"}</td>
                    <td>{livraison.dateLivraison || livraison.dateCreation || "-"}</td>
                    <td>{livraison.statut || "-"}</td>
                    <td>
                      <div className="d-flex gap-2 flex-wrap">
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleLivree(livraison.id)}
                          disabled={!canMarkLivree || workingId === livraison.id}
                        >
                          {workingId === livraison.id ? "Traitement..." : "Marquer LIVREE"}
                        </button>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleCreateFacture(livraison.id)}
                          disabled={!canCreateFacture || workingId === livraison.id}
                        >
                          Creer facture
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="page-card__header" style={{ marginTop: 24 }}>
        <div>
          <p className="page-eyebrow">Factures</p>
          <h2>Factures de l'entreprise</h2>
        </div>
        <p className="page-muted">Liste synchronisee apres creation de facture.</p>
      </div>

      <StatGrid items={factureStats} />

      <div className="table-responsive">
        <table className="table table-striped table-bordered">
          <thead>
            <tr>
              <th>ID</th>
              <th>Reference</th>
              <th>Livraison</th>
              <th>Client</th>
              <th>Montant TTC</th>
              <th>Statut</th>
              <th>Export</th>
            </tr>
          </thead>
          <tbody>
            {factures.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center">Aucune facture generee.</td>
              </tr>
            ) : (
              factures.map((facture) => (
                <tr key={facture.id}>
                  <td>{facture.id}</td>
                  <td>{facture.reference || "-"}</td>
                  <td>{facture.livraison?.id || "-"}</td>
                  <td>{facture.client?.nom || "-"}</td>
                  <td>{facture.montantTtc ?? "-"}</td>
                  <td>{facture.statut || "-"}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={() => handleExportFacture(facture)}
                      disabled={exportingId === facture.id}
                    >
                      {exportingId === facture.id ? "Export..." : "Exporter PDF"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}