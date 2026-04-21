import { useEffect, useMemo, useState } from "react";
import { getDepartments } from "../../api/departmentApi";
import { getProduits, assignProduitDepartment } from "../../api/produitApi";
import Type120AdminNav from "../../components/Type120AdminNav";

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

export default function Type120ProduitsPage() {
  const [produits, setProduits] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [filters, setFilters] = useState({ search: "", departmentId: "" });
  const [assigningProduitId, setAssigningProduitId] = useState(null);
  const [assignmentByProduit, setAssignmentByProduit] = useState({});

  const refreshData = async () => {
    setLoading(true);
    setError("");
    try {
      const [produitsRes, departmentsRes] = await Promise.allSettled([
        getProduits(),
        getDepartments(),
      ]);

      setProduits(
        produitsRes.status === "fulfilled" && Array.isArray(produitsRes.value.data)
          ? produitsRes.value.data
          : []
      );
      setDepartments(
        departmentsRes.status === "fulfilled" && Array.isArray(departmentsRes.value.data)
          ? departmentsRes.value.data
          : []
      );
    } catch (loadError) {
      setError("Impossible de charger les produits.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const filteredProduits = useMemo(() => {
    const search = normalize(filters.search);
    const departmentId = normalize(filters.departmentId);

    return produits.filter((produit) => {
      const matchesSearch =
        !search ||
        [produit?.nom, produit?.id, produit?.department?.nom]
          .filter(Boolean)
          .some((value) => normalize(value).includes(search));
      const matchesDepartment = !departmentId || String(produit?.department?.id || "") === departmentId;
      return matchesSearch && matchesDepartment;
    });
  }, [filters, produits]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const handleProduitDepartmentSelect = (produitId, departmentId) => {
    setAssignmentByProduit((current) => ({
      ...current,
      [produitId]: departmentId,
    }));
  };

  const handleAssignProduitDepartment = async (produit) => {
    const selectedDepartmentId = assignmentByProduit[produit.id];
    const currentDepartmentId = produit?.department?.id ? String(produit.department.id) : "";

    if (selectedDepartmentId === currentDepartmentId) {
      setMessage("Le produit est deja assigne a ce departement.");
      return;
    }

    setMessage("");
    setError("");
    setAssigningProduitId(produit.id);

    try {
      await assignProduitDepartment(
        produit.id,
        selectedDepartmentId ? Number(selectedDepartmentId) : null
      );
      setMessage("Departement du produit mis a jour.");
      await refreshData();
    } catch (assignError) {
      setError(assignError?.response?.data?.message || "Impossible d'assigner le departement.");
    } finally {
      setAssigningProduitId(null);
    }
  };

  return (
    <div className="page-card">
      <Type120AdminNav />

      {error ? <div className="alert alert-warning page-alert">{error}</div> : null}
      {message ? <div className="alert alert-success page-alert">{message}</div> : null}

      <section className="workflow-card">
        <div className="request-list__header">
          <div>
            <h3>Produits disponibles</h3>
            <p className="page-muted">Liste complete des produits avec assignation de departement.</p>
          </div>
        </div>

        <div className="row" style={{ marginBottom: 12 }}>
          <div className="col-md-8">
            <label className="form-label">Recherche</label>
            <input className="form-control" name="search" value={filters.search} onChange={handleFilterChange} placeholder="Nom, ID, departement..." />
          </div>
          <div className="col-md-4">
            <label className="form-label">Filtre departement</label>
            <select className="form-control" name="departmentId" value={filters.departmentId} onChange={handleFilterChange}>
              <option value="">Tous</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>{department.nom}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-striped table-bordered">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nom</th>
                <th>Prix</th>
                <th>Stock</th>
                <th>Department ID</th>
                <th>Stock disponible</th>
                <th>Stock reserve</th>
                <th>Stock min</th>
                <th>Assigner au departement</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" className="text-center">Chargement...</td></tr>
              ) : filteredProduits.length === 0 ? (
                <tr><td colSpan="9" className="text-center">Aucun produit trouve.</td></tr>
              ) : (
                filteredProduits.map((produit) => {
                  const currentDepartmentId = produit?.department?.id ? String(produit.department.id) : "";
                  const selectedDepartmentId = assignmentByProduit[produit.id] !== undefined ? assignmentByProduit[produit.id] : currentDepartmentId;

                  return (
                    <tr key={produit.id}>
                      <td>{produit.id}</td>
                      <td>{produit.nom || "-"}</td>
                      <td>{produit.prix ?? "-"}</td>
                      <td>{produit.stock ?? 0}</td>
                      <td>{produit.department?.id ?? "-"}</td>
                      <td>{produit.stockDisponible ?? 0}</td>
                      <td>{produit.stockReserve ?? 0}</td>
                      <td>{produit.stockMin ?? 0}</td>
                      <td>
                        <div style={{ display: "flex", gap: 8, minWidth: 240 }}>
                          <select
                            className="form-control"
                            value={selectedDepartmentId}
                            onChange={(event) => handleProduitDepartmentSelect(produit.id, event.target.value)}
                          >
                            <option value="">Aucun</option>
                            {departments.map((department) => (
                              <option key={department.id} value={department.id}>{department.nom}</option>
                            ))}
                          </select>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleAssignProduitDepartment(produit)}
                            disabled={assigningProduitId === produit.id}
                          >
                            {assigningProduitId === produit.id ? "..." : "Assigner"}
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
      </section>
    </div>
  );
}
