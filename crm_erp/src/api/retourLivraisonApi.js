import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8080";
const API_URL = `${API_BASE_URL}/api/retours-livraison`;

export const getEnterpriseRetours = (connectedUserId) => {
  return axios.get(`${API_URL}/entreprise`, {
    params: { userId: connectedUserId },
  });
};

export const getLivraisonLots = (livraisonId, connectedUserId) => {
  return axios.get(`${API_URL}/livraison/${livraisonId}/lots`, {
    params: { userId: connectedUserId },
  });
};

export const createRetourLivraison = (payload) => {
  return axios.post(`${API_URL}/save`, payload);
};

export const updateRetourStatus = (id, payload) => {
  return axios.patch(`${API_URL}/${id}/status`, payload);
};

export const getRetourDetail = (id, connectedUserId) => {
  return axios.get(`${API_URL}/${id}`, {
    params: { userId: connectedUserId },
  });
};
