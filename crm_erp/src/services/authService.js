import { loginApi } from "../api/authApi";

export const login = async (email, password) => {
  const response = await loginApi({ email, password });

  const data = response.data;

  localStorage.setItem("user", JSON.stringify(data.user));
  localStorage.setItem("roles", JSON.stringify(data.roles));
  localStorage.setItem(
    "access",
    JSON.stringify(data.accessibleDepartments)
  );

  return data;
};

export const logout = () => {
  localStorage.clear();
};