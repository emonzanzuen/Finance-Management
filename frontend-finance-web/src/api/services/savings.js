import { http } from "../http.js";

const data = (res) => res.data.data;
export const savingsService = {
  list: async () => data(await http.get("/savings-goals")),
  get: async (id) => data(await http.get(`/savings-goals/${id}`)),
  create: async (body) => data(await http.post("/savings-goals", body)),
  update: async ({ id, body }) => data(await http.patch(`/savings-goals/${id}`, body)),
  remove: async (id) => { await http.delete(`/savings-goals/${id}`); },
  deposit: async ({ id, body }) => data(await http.post(`/savings-goals/${id}/deposits`, body)),
  withdraw: async ({ id, body }) => data(await http.post(`/savings-goals/${id}/withdrawals`, body)),
  deleteDeposit: async ({ id, entryId }) => { await http.delete(`/savings-goals/${id}/deposits/${entryId}`); },
};
