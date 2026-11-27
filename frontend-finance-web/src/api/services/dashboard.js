import { http } from "../http.js";

export const dashboardService = {
  summary: async (month, year) => (await http.get("/dashboard/summary", { params: { month, year } })).data.data,
};
