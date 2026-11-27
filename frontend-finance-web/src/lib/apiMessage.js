/** Pesan untuk pengguna dari ApiError: pakai terjemahan errors.<CODE>, jatuh ke pesan server bila tidak ada. */
export function apiMessage(t, error) {
  if (!error) return "";
  const key = `errors.${error.code}`;
  const msg = t(key);
  return msg && msg !== key ? msg : error.message || t("errors.UNKNOWN");
}
