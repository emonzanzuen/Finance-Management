import { http } from "../http.js";

const clean = (params = {}) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== "" && v !== null && v !== undefined));

export const transactionService = {
  /** @returns {{ items: object[], meta: object }} */
  list: async (params) => {
    const res = await http.get("/transactions", { params: clean(params) });
    return { items: res.data.data, meta: res.data.meta };
  },
  get: async (id) => (await http.get(`/transactions/${id}`)).data.data,
  create: async (body) => (await http.post("/transactions", body)).data.data,
  update: async (id, body) => (await http.patch(`/transactions/${id}`, body)).data.data,
  remove: async (id) => {
    await http.delete(`/transactions/${id}`);
  },
};
