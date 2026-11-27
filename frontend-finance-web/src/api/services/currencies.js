import { http } from "../http.js";

export const currencyService = {
  list: async () => (await http.get("/currencies")).data.data,
};
