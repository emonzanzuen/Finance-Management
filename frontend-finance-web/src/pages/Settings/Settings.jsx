import React from "react";
import toast from "react-hot-toast";
import { Moon, Sun, Globe, RefreshCw, Clock, CircleHelp } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useApp } from "../../context/AppContext";
import { useTranslation } from "../../hooks/useTranslation";

export default function Settings() {
  const { isDark, toggleTheme } = useTheme(); const { t } = useTranslation();
  const { currency, setCurrency, language, setLanguage, currencies, isLoadingRates, ratesLastUpdated, ratesSource, ratesError, refreshRates } = useApp();
  const handleCurrency = (e) => { setCurrency(e.target.value); toast.success(`Mata uang tampilan: ${e.target.value}`); };
  const updatedAt = ratesLastUpdated ? new Date(ratesLastUpdated).toLocaleString(language === "id" ? "id-ID" : "en-US") : "Belum tersedia";
  return <div className="mx-auto max-w-3xl space-y-6"><div><h2 className="text-2xl font-bold">{t("nav.settings")}</h2><p className="text-sm text-gray-500">Preferensi antarmuka disimpan di perangkat; kurs diambil dari backend.</p></div>
    <section className="space-y-4 rounded-2xl border bg-white p-6 dark:border-gray-800 dark:bg-gray-900"><h3 className="font-semibold">Tampilan</h3><div className="flex items-center justify-between gap-4"><div className="flex items-center gap-3">{isDark ? <Moon className="h-5 w-5"/> : <Sun className="h-5 w-5"/>}<div><p className="font-medium">Tema</p><p className="text-sm text-gray-500">{isDark ? "Gelap" : "Terang"}</p></div></div><button className="btn btn-outline" onClick={toggleTheme}>Ganti tema</button></div><div className="flex items-center justify-between gap-4"><div className="flex items-center gap-3"><Globe className="h-5 w-5"/><div><p className="font-medium">Bahasa</p><p className="text-sm text-gray-500">Bahasa antarmuka</p></div></div><select className="input max-w-48" value={language} onChange={(e) => { setLanguage(e.target.value); toast.success("Bahasa berhasil diubah."); }}><option value="id">Bahasa Indonesia</option><option value="en">English</option></select></div></section>
    <section className="space-y-4 rounded-2xl border bg-white p-6 dark:border-gray-800 dark:bg-gray-900"><div><h3 className="font-semibold">Mata uang tampilan</h3><p className="text-sm text-gray-500">Catatan transaksi tetap disimpan dalam IDR.</p></div><select className="input" value={currency} onChange={handleCurrency}><option value="IDR">IDR · Rupiah Indonesia</option>{currencies.filter((x) => x.code !== "IDR").map((x) => <option key={x.code} value={x.code}>{x.code} · {x.name}</option>)}</select><div className="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-500"><span className="flex items-center gap-2"><Clock className="h-4 w-4"/>Kurs {ratesSource} · {updatedAt}</span><button className="btn btn-outline" onClick={() => void refreshRates()} disabled={isLoadingRates}><RefreshCw className={`mr-2 h-4 w-4 ${isLoadingRates ? "animate-spin" : ""}`}/>Perbarui kurs</button></div>{ratesError && <p role="alert" className="text-sm text-amber-600">Kurs backend belum dapat dimuat; nilai cadangan dipakai.</p>}</section>
    <section className="rounded-2xl border bg-white p-6 dark:border-gray-800 dark:bg-gray-900"><div className="flex gap-3"><CircleHelp className="h-5 w-5 text-primary-600"/><div><h3 className="font-semibold">Tentang FinManage</h3><p className="mt-1 text-sm text-gray-500">FinManage mencatat pemasukan, pengeluaran, anggaran, dan tabungan. Aplikasi tidak menyimpan atau memindahkan uang dan tidak terhubung ke rekening bank.</p></div></div></section>
  </div>;
}
