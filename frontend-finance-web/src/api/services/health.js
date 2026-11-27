import { http } from "../http.js";

export const healthService = { check: async () => (await http.get("/health")).data.data };
