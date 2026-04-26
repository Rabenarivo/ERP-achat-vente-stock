import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { getEnterpriseLivraisons } from "../../api/livraisonApi";
import {
  createRetourLivraison,
  getEnterpriseRetours,
  getLivraisonLots,
  updateRetourStatus,
} from "../../api/retourLivraisonApi";
import Type120AdminNav from "../../components/Type120AdminNav";

const emptyLine = {
  livraisonLotId: "",
  motif: "DEFECTUEUX",
  quantiteRetour: "",
  decisionStock: "QUARANTAINE",
  commentaire: "",
};

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

export default function Type120RetoursPage() {
  const { user } = useContext(AuthContext);
  const [livraisons, setLivraisons] = useState([]);
  const [lots, setLots] = useState([]);
  const [retours, setRetours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusLoadingId, setStatusLoadingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    search: "",
    statut: "",
  });
  const [form, setForm] = useState({
    livraisonId: "",
    reference: "",
    motifGlobal: "",
    commentaire: "",
    lignes: [{ ...emptyLine }],
  });

  const loadData = useCallback(async () => {
    if (!user?.id) {
      setError("Utilisateur non connecte.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [livraisonRes, retourRes] = await Promise.allSettled([
        getEnterpriseLivraisons(user.id),
        getEnterpriseRetours(user.id),
      ]);

      const livraisonData = livraisonRes.status === "fulfilled" ? livraisonRes.value?.data?.data : [];
      const retourData = retourRes.status === "fulfilled" ? retourRes.value?.data?.data : [];

      setLivraisons(Array.isArray(livraisonData) ? livraisonData : []);
      setRetours(Array.isArray(retourData) ? retourData : []);

      const livraisonError = livraisonRes.status === "rejected"
        ? livraisonRes.reason?.response?.data?.message || ""
        : "";
      const retourError = retourRes.status === "rejected"
        ? retourRes.reason?.response?.data?.message || ""
        : "";

      if (livraisonError || retourError) {
        setError([livraisonError, retourError].filter(Boolean).join(" | "));
      }
    } catch (loadError) {
      setError(loadError?.response?.data?.message || "Impossible de charger les donnees.");
      setLivraisons([]);
      setRetours([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const loadLots = async () => {
      if (!form.livraisonId || !user?.id) {
        setLots([]);
        return;
      }

      try {
        const response = await getLivraisonLots(Number(form.livraisonId), user.id);
        const lotData = response?.data?.data;
        setLots(Array.isArray(lotData) ? lotData : []);
      } catch (lotError) {
        setLots([]);
        setError(lotError?.response?.data?.message || "Impossible de charger les lots de livraison.");
      }
    };

    loadLots();
  }, [form.livraisonId, user?.id]);

  const statuts = useMemo(() => {
    const values = new Set();
    retours.forEach((item) => values.add(String(item?.statut || "SANS_STATUT")));
    return Array.from(values.values());
  }, [retours]);

  const filteredRetours = useMemo(() => {
    const search = normalize(filters.search);
    const statut = normalize(filters.statut);

    return retours.filter((item) => {
      const matchesSearch =
        !search ||
        [item?.reference, item?.statut, item?.motifGlobal, item?.livraison?.reference]
          .filter(Boolean)
          .some((value) => normalize(value).includes(search));
      const matchesStatut = !statut || normalize(item?.statut) === statut;
      return matchesSearch && matchesStatut;
    });
  }, [retours, filters]);

  const availableLivraisons = useMemo(() => {
    return livraisons.filter((item) => String(item?.statut || "").toUpperCase() === "LIVREE");
  }, [livraisons]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleLineChange = (index, field, value) => {
    setForm((current) => {
      const lignes = [...current.lignes];
      lignes[index] = { ...lignes[index], [field]: value };
      return { ...current, lignes };
    });
  };

  const addLine = () => {
    setForm((current) => ({
      ...current,
      lignes: [...current.lignes, { ...emptyLine }],
    }));
  };

  const removeLine = (index) => {
    setForm((current) => {
      if (current.lignes.length <= 1) return current;
      const lignes = current.lignes.filter((_, idx) => idx !== index);
      return { ...current, lignes };
    });
  };

  const resetForm = () => {
    setForm({
      livraisonId: "",
      reference: "",
      motifGlobal: "",
      commentaire: "",
      lignes: [{ ...emptyLine }],
    });
    setLots([]);
  };

  const submitRetour = async (event) => {
    event.preventDefault();
    if (!user?.id) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const payload = {
        userId: user.id,
        livraisonId: Number(form.livraisonId),
        reference: form.reference || null,
        motifGlobal: form.motifGlobal || null,
        commentaire: form.commentaire || null,
        lignes: form.lignes.map((line) => ({
          livraisonLotId: Number(line.livraisonLotId),
          motif: line.motif,
          quantiteRetour: Number(line.quantiteRetour),
          decisionStock: line.decisionStock,
          commentaire: line.commentaire || null,
        })),
      };

      await createRetourLivraison(payload);
      setMessage("Retour de livraison cree avec succes.");
      resetForm();
      await loadData();
    } catch (saveError) {
      setError(saveError?.response?.data?.message || "Impossible de creer le retour.");
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (retourId, statut) => {
    if (!user?.id) return;

    try {
      setStatusLoadingId(retourId);
      setError("");
      setMessage("");
      await updateRetourStatus(retourId, {
        userId: user.id,
        statut,
      });
      setMessage(`Retour ${retourId} passe a ${statut}.`);
      await loadData();
    } catch (statusError) {
      setError(statusError?.response?.data?.message || "Impossible de changer le statut.");
    } finally {
      setStatusLoadingId(null);
    }
  };

  return (
    <div className="page-card">
      <Type120AdminNav />

      {error ? <div className="alert alert-warning page-alert">{error}</div> : null}
      {message ? <div className="alert alert-success page-alert">{message}</div> : null}

      <section className="workflow-card" style={{ marginBottom: 16 }}>
        <div className="request-list__header">
          <div>
            <h3>Creer un retour livraison</h3>
            <p className="page-muted">Retour lot par lot avec motif et decision de stock.</p>
          </div>
        </div>

        <form onSubmit={submitRetour}>
          <div className="row">
            <div className="col-md-3">
              <label className="form-label">Livraison</label>
              <select className="form-control" name="livraisonId" value={form.livraisonId} onChange={handleFormChange} required>
                <option value="">Selectionner</option>
                {availableLivraisons.map((livraison) => (
                  <option key={livraison.id} value={livraison.id}>
                    {livraison.reference || `LIV-${livraison.id}`}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Reference retour</label>
              <input className="form-control" name="reference" value={form.reference} onChange={handleFormChange} placeholder="RET-... (optionnel)" />
            </div>
            <div className="col-md-3">
              <label className="form-label">Motif global</label>
              <input className="form-control" name="motifGlobal" value={form.motifGlobal} onChange={handleFormChange} placeholder="Defaut lot, HS..." />
            </div>
            <div className="col-md-3">
              <label className="form-label">Commentaire</label>
              <input className="form-control" name="commentaire" value={form.commentaire} onChange={handleFormChange} />
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            {form.lignes.map((line, index) => (
              <div className="row" key={`line-${index}`} style={{ marginBottom: 8 }}>
                <div className="col-md-3">
                  <select
                    className="form-control"
                    value={line.livraisonLotId}
                    onChange={(event) => handleLineChange(index, "livraisonLotId", event.target.value)}
                    required
                  >
                    <option value="">Lot</option>
                    {lots.map((lot) => (
                      <option key={lot.id} value={lot.id}>
                        {lot.lotReference} | Qte livree: {lot.quantiteLivree} | Ret: {lot.quantiteRetournee}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2">
                  <select className="form-control" value={line.motif} onChange={(event) => handleLineChange(index, "motif", event.target.value)}>
                    <option value="DEFECTUEUX">DEFECTUEUX</option>
                    <option value="HS">HS</option>
                    <option value="ERREUR_LIVRAISON">ERREUR_LIVRAISON</option>
                    <option value="AUTRE">AUTRE</option>
                  </select>
                </div>
                <div className="col-md-2">
                  <input
                    type="number"
                    className="form-control"
                    min="1"
                    value={line.quantiteRetour}
                    onChange={(event) => handleLineChange(index, "quantiteRetour", event.target.value)}
                    placeholder="Quantite"
                    required
                  />
                </div>
                <div className="col-md-2">
                  <select className="form-control" value={line.decisionStock} onChange={(event) => handleLineChange(index, "decisionStock", event.target.value)}>
                    <option value="QUARANTAINE">QUARANTAINE</option>
                    <option value="HS">HS</option>
                    <option value="RETOUR_FOURNISSEUR">RETOUR_FOURNISSEUR</option>
                    <option value="REINTEGRATION">REINTEGRATION</option>
                  </select>
                </div>
                <div className="col-md-2">
                  <input className="form-control" value={line.commentaire} onChange={(event) => handleLineChange(index, "commentaire", event.target.value)} placeholder="Commentaire" />
                </div>
                <div className="col-md-1">
                  <button type="button" className="btn btn-default" onClick={() => removeLine(index)}>
                    -
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 12 }}>
            <button type="button" className="btn btn-default" onClick={addLine}>
              Ajouter ligne
            </button>
            <button type="submit" className="btn btn-primary" style={{ marginLeft: 8 }} disabled={saving}>
              {saving ? "Enregistrement..." : "Creer retour"}
            </button>
          </div>
        </form>
      </section>

      <section className="workflow-card">
        <div className="request-list__header">
          <div>
            <h3>Suivi des retours</h3>
            <p className="page-muted">Validation et cloture des retours de livraison.</p>
          </div>
        </div>

        <div className="row" style={{ marginBottom: 12 }}>
          <div className="col-md-8">
            <label className="form-label">Recherche</label>
            <input className="form-control" name="search" value={filters.search} onChange={handleFilterChange} placeholder="Reference, statut, livraison..." />
          </div>
          <div className="col-md-4">
            <label className="form-label">Statut</label>
            <select className="form-control" name="statut" value={filters.statut} onChange={handleFilterChange}>
              <option value="">Tous</option>
              {statuts.map((statut) => (
                <option key={statut} value={statut}>{statut}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-striped table-bordered">
            <thead>
              <tr>
                <th>ID</th>
                <th>Reference</th>
                <th>Livraison</th>
                <th>Motif</th>
                <th>Statut</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="text-center">Chargement...</td></tr>
              ) : filteredRetours.length === 0 ? (
                <tr><td colSpan="7" className="text-center">Aucun retour.</td></tr>
              ) : (
                filteredRetours.map((retour) => (
                  <tr key={retour.id}>
                    <td>{retour.id}</td>
                    <td>{retour.reference || "-"}</td>
                    <td>{retour.livraison?.reference || retour.livraison?.id || "-"}</td>
                    <td>{retour.motifGlobal || "-"}</td>
                    <td>{retour.statut || "-"}</td>
                    <td>{retour.dateRetour ? new Date(retour.dateRetour).toLocaleString("fr-FR") : "-"}</td>
                    <td>
                      <button
                        className="btn btn-xs btn-primary"
                        disabled={statusLoadingId === retour.id || String(retour?.statut || "").toUpperCase() === "VALIDE" || String(retour?.statut || "").toUpperCase() === "CLOTURE"}
                        onClick={() => changeStatus(retour.id, "VALIDE")}
                      >
                        Valider
                      </button>{" "}
                      <button
                        className="btn btn-xs btn-default"
                        disabled={statusLoadingId === retour.id || String(retour?.statut || "").toUpperCase() === "REFUSE" || String(retour?.statut || "").toUpperCase() === "CLOTURE"}
                        onClick={() => changeStatus(retour.id, "REFUSE")}
                      >
                        Refuser
                      </button>{" "}
                      <button
                        className="btn btn-xs btn-secondary"
                        disabled={statusLoadingId === retour.id || String(retour?.statut || "").toUpperCase() === "CLOTURE"}
                        onClick={() => changeStatus(retour.id, "CLOTURE")}
                      >
                        Cloturer
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
