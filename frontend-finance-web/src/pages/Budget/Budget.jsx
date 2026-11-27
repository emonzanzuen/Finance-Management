import React, { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, ArrowUpCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useApp } from "../../context/AppContext";
import { useBudgets, useCategories, useCreateBudget, useDeleteBudget, useTopUpBudget, useUpdateBudget, useSavingsGoals } from "../../hooks/queries";
import { formatCurrencyWithRate } from "../../utils/formatters";
import { apiMessage } from "../../lib/apiMessage";
import { useTranslation } from "../../hooks/useTranslation";

const emptyForm = { categoryId: "", budgetAmount: "", amount: "", source: "manual", goalId: "" };
export default function Budget() {
  const { t } = useTranslation();
  const { currency, exchangeRates } = useApp();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [dialog, setDialog] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const { data, isLoading, isError, refetch } = useBudgets(month, year);
  const { data: categories = [] } = useCategories("expense");
  const { data: savings } = useSavingsGoals();
  const create = useCreateBudget(); const update = useUpdateBudget(); const remove = useDeleteBudget(); const topUp = useTopUpBudget();
  const busy = create.isPending || update.isPending || remove.isPending || topUp.isPending;
  const money = (v) => formatCurrencyWithRate(Number(v || 0), currency, exchangeRates);
  const items = data?.items ?? [];
  const categoryIds = useMemo(() => new Set(items.map((x) => x.category?.id)), [items]);
  const open = (mode, item = null) => {
    setError(""); setDialog({ mode, item });
    setForm(item ? { ...emptyForm, categoryId: item.category?.id ?? "", budgetAmount: String(item.budgetAmount ?? "") } : emptyForm);
  };
  const close = () => { if (!busy) setDialog(null); };
  const submit = async (e) => {
    e.preventDefault(); setError("");
    try {
      if (dialog.mode === "topup") {
        await topUp.mutateAsync({ id: dialog.item.id, body: { amount: Number(form.amount), source: form.source, ...(form.source === "savings" ? { goalId: form.goalId } : {}) } });
        toast.success("Anggaran berhasil ditambah.");
      } else if (dialog.mode === "edit") {
        await update.mutateAsync({ id: dialog.item.id, body: { budgetAmount: Number(form.budgetAmount) } });
        toast.success("Anggaran berhasil diperbarui.");
      } else {
        await create.mutateAsync({ categoryId: form.categoryId, month, year, budgetAmount: Number(form.budgetAmount) });
        toast.success("Anggaran berhasil ditambahkan.");
      }
      setDialog(null);
    } catch (err) { setError(apiMessage(t, err)); }
  };
  const deleteItem = async (item) => {
    if (!window.confirm(`Hapus anggaran kategori ${item.category?.name}?`)) return;
    try { await remove.mutateAsync(item.id); toast.success("Anggaran dihapus."); }
    catch (err) { toast.error(apiMessage(t, err)); }
  };
  const changePeriod = (delta) => { const date = new Date(year, month - 1 + delta, 1); setMonth(date.getMonth() + 1); setYear(date.getFullYear()); };
  const categoriesAvailable = categories.filter((c) => !categoryIds.has(c.id));

  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-2xl font-bold">{t("nav.budget")}</h2><p className="text-sm text-gray-500">Anggaran dan pemakaian dihitung dari backend.</p></div><button className="btn btn-primary" onClick={() => open("create")} disabled={!categoriesAvailable.length}><Plus className="mr-2 h-4 w-4" />Tambah anggaran</button></div>
    <div className="flex items-center gap-3"><button className="btn btn-outline" onClick={() => changePeriod(-1)}>‹</button><strong>{new Date(year, month - 1, 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" })}</strong><button className="btn btn-outline" onClick={() => changePeriod(1)}>›</button></div>
    {isError && <div role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">Gagal memuat anggaran. <button className="underline" onClick={() => refetch()}>Coba lagi</button></div>}
    {isLoading ? <p className="py-10 text-center text-gray-500">Memuat anggaran…</p> : <>
      <div className="grid gap-4 sm:grid-cols-3">{[["Total anggaran", data?.summary?.totalBudget], ["Terpakai", data?.summary?.totalSpent], ["Sisa", data?.summary?.remaining]].map(([label, value]) => <div key={label} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"><p className="text-sm text-gray-500">{label}</p><p className="mt-2 text-xl font-bold">{money(value)}</p></div>)}</div>
      {items.length ? <div className="grid gap-4 lg:grid-cols-2">{items.map((item) => { const pct = Number(item.percentage || 0); const tone = item.status === "exceeded" || item.status === "critical" ? "bg-rose-500" : item.status === "warning" ? "bg-amber-500" : "bg-emerald-500"; return <article key={item.id} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold">{item.category?.name}</h3><p className="mt-1 text-sm text-gray-500">{money(item.spentAmount)} dari {money(item.budgetAmount)} · sisa {money(item.remaining)}</p></div><div className="flex gap-1"><button className="btn btn-outline" title="Tambah anggaran" onClick={() => open("topup", item)}><ArrowUpCircle className="h-4 w-4" /></button><button className="btn btn-outline" title="Ubah" onClick={() => open("edit", item)}><Pencil className="h-4 w-4" /></button><button className="btn btn-outline text-rose-600" title="Hapus" onClick={() => deleteItem(item)}><Trash2 className="h-4 w-4" /></button></div></div><div className="mt-4 h-2 overflow-hidden rounded bg-gray-100 dark:bg-gray-800"><div className={`h-full ${tone}`} style={{ width: `${Math.min(pct, 100)}%` }} /></div><p className="mt-2 text-right text-xs text-gray-500">{pct.toFixed(0)}% · {item.status}</p></article>; })}</div> : <div className="rounded-2xl border border-dashed p-10 text-center text-gray-500">Belum ada anggaran untuk periode ini.</div>}
    </>}
    {dialog && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={(e) => e.target === e.currentTarget && close()}><form onSubmit={submit} className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900"><h3 className="text-lg font-semibold">{dialog.mode === "create" ? "Tambah anggaran" : dialog.mode === "edit" ? "Ubah anggaran" : "Tambah alokasi anggaran"}</h3>{error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}{dialog.mode === "create" && <label className="block text-sm">Kategori<select required className="input mt-1" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}><option value="">Pilih kategori</option>{categoriesAvailable.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>}{dialog.mode === "topup" && <><label className="block text-sm">Sumber<select className="input mt-1" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}><option value="manual">Tambah manual</option><option value="savings">Dari tabungan</option></select></label>{form.source === "savings" && <label className="block text-sm">Target tabungan<select required className="input mt-1" value={form.goalId} onChange={(e) => setForm({ ...form, goalId: e.target.value })}><option value="">Pilih target</option>{(savings?.items ?? []).map((g) => <option key={g.id} value={g.id}>{g.title} ({money(g.currentAmount)})</option>)}</select></label>}</>}
      <label className="block text-sm">Nominal<input required min="1" step="1" type="number" className="input mt-1" value={dialog.mode === "topup" ? form.amount : form.budgetAmount} onChange={(e) => setForm({ ...form, [dialog.mode === "topup" ? "amount" : "budgetAmount"]: e.target.value })} /></label><div className="flex justify-end gap-2"><button type="button" className="btn btn-outline" onClick={close} disabled={busy}>Batal</button><button className="btn btn-primary" disabled={busy}>{busy ? "Menyimpan…" : "Simpan"}</button></div></form></div>}
  </div>;
}
