import axios, { type AxiosInstance } from "axios";

export const api: AxiosInstance = axios.create({
  baseURL: import.meta.env["VITE_API_BASE_URL"] ?? "/api/v1",
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.set("Authorization", `Bearer ${authToken}`);
  }
  return config;
});
