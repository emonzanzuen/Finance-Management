/** Aturan murni yang dicerminkan dari backend (docs/rules.md) untuk umpan balik cepat di form. Server tetap sumber kebenaran. */

export const AMOUNT_MAX = 999_999_999_999;
export const WIB = "Asia/Jakarta";

/** 12 warna preset kategori. */
export const COLOR_PRESETS = [
  "#6366f1", "#22c55e", "#ef4444", "#f59e0b",
  "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6",
  "#f97316", "#06b6d4", "#84cc16", "#a855f7",
];

/** Pesan kesalahan kebijakan password (BR password), atau null bila valid. */
export function validatePassword(password, email = "") {
  if (typeof password !== "string" || password.length < 8) return "Password minimal 8 karakter.";
  if (password.length > 128) return "Password maksimal 128 karakter.";
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return "Password harus berisi huruf dan angka.";
  if (email && password.toLowerCase() === String(email).trim().toLowerCase()) return "Password tidak boleh sama dengan email.";
  return null;
}

/** Tanggal hari ini (YYYY-MM-DD) pada zona Asia/Jakarta (BR-04, BR-05). */
export function todayWIB(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: WIB, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(now);
}

/** Tanggal kalender valid berformat YYYY-MM-DD (menolak 2026-02-30). */
export function isValidDate(s) {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/** Hapus pemisah ribuan dan ubah input nominal menjadi bilangan bulat; NaN bila tidak valid. */
export function parseAmountInput(value) {
  const digits = String(value ?? "").replace(/[^\d]/g, "");
  return digits === "" ? NaN : Number(digits);
}

/** Tambah pemisah ribuan saat mengetik (1500000 menjadi 1.500.000). */
export function formatAmountInput(value) {
  const digits = String(value ?? "").replace(/[^\d]/g, "");
  return digits === "" ? "" : Number(digits).toLocaleString("id-ID");
}
