/**
 * Penyimpanan token JWT di browser.
 * Catatan keamanan: localStorage dapat dibaca skrip apa pun di halaman (risiko XSS).
 * Kontrak API memakai header Authorization, jadi cookie httpOnly belum tersedia.
 * Jangan memuat skrip pihak ketiga yang tidak tepercaya di aplikasi ini.
 */
const KEY = "finmanage.token";
let memory = null;

export const tokenStore = {
  get() {
    if (memory !== null) return memory;
    try {
      memory = localStorage.getItem(KEY);
    } catch {
      memory = null;
    }
    return memory;
  },
  set(token) {
    memory = token;
    try {
      localStorage.setItem(KEY, token);
    } catch {
      /* penyimpanan tidak tersedia: token hanya di memori */
    }
  },
  clear() {
    memory = null;
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* diabaikan */
    }
  },
};
