import { http } from "../http.js";

const data = (res) => res.data.data;
export const budgetService = {
  list: async (month, year) => data(await http.get("/budgets", { params: { month, year } })),
  create: async (body) => data(await http.post("/budgets", body)),
  update: async ({ id, body }) => data(await http.patch(`/budgets/${id}`, body)),
  remove: async (id) => { await http.delete(`/budgets/${id}`); },
  topUp: async ({ id, body }) => data(await http.post(`/budgets/${id}/top-up`, body)),
};
