import { http } from "../http.js";

export const receiptService = {
  grantConsent: async () => { await http.post("/receipts/consent"); },
  revokeConsent: async () => { await http.delete("/receipts/consent"); },
  scan: async (file) => {
    const body = new FormData();
    body.append("image", file);
    return (await http.post("/receipts/scan", body, { headers: { "Content-Type": undefined } })).data.data;
  },
};
