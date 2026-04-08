import axios from "axios";

const API_URL = "/api/users/auth";

export const loginApi = (data) => {
  return axios.post(`${API_URL}/login`, data);
};