import { http } from "../http.js";

export const importService = {
  spec: async () => (await http.get("/imports/spec")).data.data,
  template: async () => (await http.get("/imports/template", { responseType: "blob" })),
  preview: async (file) => {
    const body = new FormData();
    body.append("file", file);
    return (await http.post("/imports/transactions/preview", body, { headers: { "Content-Type": undefined } })).data.data;
  },
  commit: async (body) => (await http.post("/imports/transactions/commit", body)).data.data,
};
