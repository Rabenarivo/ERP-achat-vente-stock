import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8080";
const API_URL = `${API_BASE_URL}/api/factures`;

export const createFactureFromLivraison = (payload, connectedUserId) => {
  return axios.post(`${API_URL}/from-livraison`, payload, {
    headers: {
      "X-User-Id": connectedUserId,
    },
  });
};

export const getEnterpriseFactures = (connectedUserId) => {
  return axios.get(`${API_URL}/entreprise`, {
    headers: {
      "X-User-Id": connectedUserId,
    },
  });
};
