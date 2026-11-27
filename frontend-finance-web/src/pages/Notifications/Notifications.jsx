import React, { useState } from "react";
import { Bell, CheckCheck, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { notificationService } from "../../api/services/notifications.js";
import { useNotificationMutation, useNotifications } from "../../hooks/queries";
import { apiMessage } from "../../lib/apiMessage";
import { useTranslation } from "../../hooks/useTranslation";

function describe(item) {
  const d = item.data || {};
  if (item.type === "budget_warning") return `Anggaran ${d.categoryName || "kategori"} mencapai ${d.percentage ?? ""}% pada ${d.month ?? ""}/${d.year ?? ""}.`;
  if (item.type === "budget_exceeded") return `Anggaran ${d.categoryName || "kategori"} terlampaui pada ${d.month ?? ""}/${d.year ?? ""}.`;
  if (item.type === "goal_completed") return `Target tabungan “${d.title || "Tabungan"}” telah tercapai.`;
  return "Ada pembaruan pada akun Anda.";
}
export default function Notifications() {
  const { t } = useTranslation(); const [page, setPage] = useState(1); const params = { page, limit: 20 };
  const query = useNotifications(params); const markOne = useNotificationMutation(notificationService.markRead); const markAll = useNotificationMutation(notificationService.markAllRead);
  const payload = query.data ?? {}; const items = payload.data ?? []; const meta = payload.meta ?? {};
  return <div className="mx-auto max-w-3xl space-y-5"><div className="flex items-center justify-between gap-3"><div><h2 className="text-2xl font-bold">Notifikasi</h2><p className="text-sm text-gray-500">Notifikasi tersimpan pada akun backend Anda.</p></div><div className="flex gap-2"><button className="btn btn-outline" onClick={() => query.refetch()} disabled={query.isFetching}><RefreshCw className={`h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`}/></button><button className="btn btn-outline" onClick={async () => { try { await markAll.mutateAsync(); toast.success("Semua notifikasi ditandai terbaca."); } catch (e) { toast.error(apiMessage(t, e)); } }} disabled={!meta.unreadCount || markAll.isPending}><CheckCheck className="mr-2 h-4 w-4"/>Tandai semua terbaca</button></div></div>
    {query.isError && <div role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">Gagal memuat notifikasi. <button className="underline" onClick={() => query.refetch()}>Coba lagi</button></div>}
    <div className="overflow-hidden rounded-2xl border bg-white dark:border-gray-800 dark:bg-gray-900">{query.isLoading ? <p className="p-8 text-center text-gray-500">Memuat…</p> : items.length ? items.map((item) => <article key={item.id} className={`flex items-start gap-3 border-b p-4 last:border-0 dark:border-gray-800 ${!item.isRead ? "bg-indigo-50/50 dark:bg-indigo-950/20" : ""}`}><Bell className="mt-1 h-5 w-5 shrink-0 text-primary-600"/><div className="min-w-0 flex-1"><p className="text-sm">{describe(item)}</p><p className="mt-1 text-xs text-gray-500">{new Date(item.createdAt).toLocaleString()}</p></div>{!item.isRead && <button className="text-xs text-primary-600" disabled={markOne.isPending} onClick={async () => { try { await markOne.mutateAsync(item.id); } catch (e) { toast.error(apiMessage(t, e)); } }}>Tandai terbaca</button>}</article>) : <p className="p-10 text-center text-sm text-gray-500">Belum ada notifikasi.</p>}</div>
    <div className="flex items-center justify-between text-sm"><span className="text-gray-500">Belum dibaca: {meta.unreadCount ?? 0}</span><div className="flex gap-2"><button className="btn btn-outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Sebelumnya</button><span className="self-center">{meta.page ?? page} / {meta.totalPages ?? 1}</span><button className="btn btn-outline" disabled={page >= (meta.totalPages ?? 1)} onClick={() => setPage((p) => p + 1)}>Berikutnya</button></div></div>
  </div>;
}
