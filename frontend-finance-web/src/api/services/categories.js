import { http } from "../http.js";

const data = (res) => res.data.data;

export const categoryService = {
  list: async (type) => data(await http.get("/categories", { params: type ? { type } : undefined })),
  create: async (body) => data(await http.post("/categories", body)),
  update: async (id, body) => data(await http.patch(`/categories/${id}`, body)),
  remove: async (id) => {
    await http.delete(`/categories/${id}`);
  },
};
