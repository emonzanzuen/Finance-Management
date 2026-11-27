import { http } from "../http.js";

export const notificationService = {
  list: async (params = {}) => (await http.get("/notifications", { params })).data,
  markRead: async (id) => { await http.patch(`/notifications/${id}/read`); },
  markAllRead: async () => { await http.post("/notifications/read-all"); },
};
