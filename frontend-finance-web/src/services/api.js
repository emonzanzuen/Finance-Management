import axios from "axios";

// Base URL for API
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("isAuthenticated");
      // Redirect to login if needed
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// API Services
export const authService = {
  login: (email, password) => api.post("/auth/login", { email, password }),
  register: (data) => api.post("/auth/register", data),
  logout: () => api.post("/auth/logout"),
  getProfile: () => api.get("/auth/profile"),
  updateProfile: (data) => api.put("/auth/profile", data),
  changePassword: (data) => api.put("/auth/change-password", data),
};

export const transactionService = {
  getAll: (params) => api.get("/transactions", { params }),
  getById: (id) => api.get(`/transactions/${id}`),
  create: (data) => api.post("/transactions", data),
  update: (id, data) => api.put(`/transactions/${id}`, data),
  delete: (id) => api.delete(`/transactions/${id}`),
  getStats: () => api.get("/transactions/stats"),
};

export const categoryService = {
  getAll: () => api.get("/categories"),
  getById: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post("/categories", data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

export const budgetService = {
  getCurrent: () => api.get("/budget/current"),
  getByMonth: (month, year) => api.get(`/budget/${year}/${month}`),
  update: (data) => api.put("/budget", data),
};

export const goalService = {
  getAll: () => api.get("/goals"),
  getById: (id) => api.get(`/goals/${id}`),
  create: (data) => api.post("/goals", data),
  update: (id, data) => api.put(`/goals/${id}`, data),
  delete: (id) => api.delete(`/goals/${id}`),
  updateProgress: (id, amount) => api.post(`/goals/${id}/progress`, { amount }),
};

export const reportService = {
  getMonthly: (month, year) => api.get(`/reports/monthly/${year}/${month}`),
  getYearly: (year) => api.get(`/reports/yearly/${year}`),
  exportPDF: (month, year) => api.get(`/reports/export/pdf/${year}/${month}`, {
    responseType: "blob",
  }),
  exportExcel: (month, year) => api.get(`/reports/export/excel/${year}/${month}`, {
    responseType: "blob",
  }),
};

export default api;