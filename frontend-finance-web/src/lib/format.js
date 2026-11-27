/** Format tanggal API (YYYY-MM-DD) tanpa pergeseran zona waktu. */
export function formatApiDate(dateStr, language = "id") {
  if (!dateStr) return "";
  const [y, m, d] = String(dateStr).slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return dateStr;
  return new Date(y, m - 1, d).toLocaleDateString(language === "en" ? "en-US" : "id-ID", {
    day: "2-digit", month: "short", year: "numeric",
  });
}
