import { http } from "../http.js";

export const reportService = {
  monthly: async (month, year) => (await http.get("/reports/monthly", { params: { month, year } })).data.data,
  trend: async (year) => (await http.get("/reports/trend", { params: { year } })).data.data,
  export: async ({ month, year, format }) => (await http.get("/reports/export", {
    params: { month, year, format }, responseType: "blob",
  })),
};
