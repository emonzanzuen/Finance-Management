import { http } from "../http.js";

const data = (res) => res.data.data;

export const authService = {
  register: async (body) => data(await http.post("/auth/register", body)),
  login: async (body) => data(await http.post("/auth/login", body)),
  logout: async () => {
    await http.post("/auth/logout");
  },
  profile: async () => data(await http.get("/profile")),
  updateProfile: async (body) => data(await http.patch("/profile", body)),
  changePassword: async (body) => data(await http.post("/auth/change-password", body)),
  logoutAll: async () => { await http.post("/auth/logout-all"); },
  forgotPassword: async (body) => { await http.post("/auth/forgot-password", body); },
  resetPassword: async (body) => { await http.post("/auth/reset-password", body); },
};
