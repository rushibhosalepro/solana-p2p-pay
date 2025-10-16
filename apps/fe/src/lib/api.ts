import { CONFIG } from "@/lib/config";
import axios from "axios";

export const api = axios.create({
  baseURL: CONFIG.SERVER_URL,
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => Promise.reject(error)
);
