import React, { useState } from "react";
import {
  AlertTriangle,
  Bell,
  Check,
  CheckCheck,
  CheckCircle2,
  OctagonAlert,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import PageHeader from "../../components/common/PageHeader";
import ErrorState from "../../components/common/ErrorState";
import Pagination from "../../components/common/Pagination";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import EmptyState from "../../components/ui/EmptyState";
import SkeletonLoader from "../../components/ui/SkeletonLoader";
import { notificationService } from "../../api/services/notifications.js";
import { useNotificationMutation, useNotifications } from "../../hooks/queries";
import { apiMessage } from "../../lib/apiMessage";
import { useTranslation } from "../../hooks/useTranslation";

const LIMIT = 20;

function getNotificationMeta(item, isEn) {
  const d = item.data || {};
  if (item.type === "budget_warning") {
    return {
      icon: AlertTriangle,
      iconBg: "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400",
      badgeVariant: "warning",
      badgeLabel: isEn ? "Budget warning" : "Peringatan anggaran",
      message: isEn
        ? `Budget for ${d.categoryName || "category"} reached ${d.percentage ?? ""}% in ${d.month ?? ""}/${d.year ?? ""}.`
        : `Anggaran ${d.categoryName || "kategori"} mencapai ${d.percentage ?? ""}% pada ${d.month ?? ""}/${d.year ?? ""}.`,
    };
  }
  if (item.type === "budget_exceeded") {
    return {
      icon: OctagonAlert,
      iconBg: "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400",
      badgeVariant: "danger",
      badgeLabel: isEn ? "Budget exceeded" : "Anggaran terlampaui",
      message: isEn
        ? `Budget for ${d.categoryName || "category"} was exceeded in ${d.month ?? ""}/${d.year ?? ""}.`
        : `Anggaran ${d.categoryName || "kategori"} terlampaui pada ${d.month ?? ""}/${d.year ?? ""}.`,
    };
  }
  if (item.type === "goal_completed") {
    return {
      icon: CheckCircle2,
      iconBg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400",
      badgeVariant: "success",
      badgeLabel: isEn ? "Goal completed" : "Target tercapai",
      message: isEn
        ? `Savings goal “${d.title || "Savings"}” has been completed.`
        : `Target tabungan “${d.title || "Tabungan"}” telah tercapai.`,
    };
  }
  return {
    icon: Bell,
    iconBg: "bg-primary-50 text-primary-600 dark:bg-primary-950/60 dark:text-primary-400",
    badgeVariant: "primary",
    badgeLabel: isEn ? "Update" : "Pembaruan",
    message: isEn ? "There is an update on your account." : "Ada pembaruan pada akun Anda.",
  };
}

export default function Notifications() {
  const { t, language } = useTranslation();
  const isEn = language === "en";
  const locale = isEn ? "en-US" : "id-ID";

  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [markingId, setMarkingId] = useState(null);

  const params = {
    page,
    limit: LIMIT,
    ...(unreadOnly ? { unreadOnly: true } : {}),
  };

  const query = useNotifications(params);
  const markOne = useNotificationMutation(notificationService.markRead);
  const markAll = useNotificationMutation(notificationService.markAllRead);

  const payload = query.data ?? {};
  const items = payload.data ?? [];
  const meta = payload.meta ?? {};
  const unreadCount = meta.unreadCount ?? 0;

  const handleFilterChange = (nextUnreadOnly) => {
    setUnreadOnly(nextUnreadOnly);
    setPage(1);
  };

  const handleMarkAll = async () => {
    try {
      await markAll.mutateAsync();
      toast.success(
        isEn
          ? "All notifications marked as read."
          : "Semua notifikasi ditandai terbaca."
      );
    } catch (e) {
      toast.error(apiMessage(t, e));
    }
  };

  const handleMarkOne = async (id) => {
    setMarkingId(id);
    try {
      await markOne.mutateAsync(id);
    } catch (e) {
      toast.error(apiMessage(t, e));
    } finally {
      setMarkingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader
        title={t("nav.notifications")}
        subtitle={
          isEn
            ? "In-app alerts synced with your FinManage account."
            : "Notifikasi dalam aplikasi yang tersimpan pada akun Anda."
        }
        icon={Bell}
        className="mb-0"
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => query.refetch()}
              disabled={query.isFetching}
              aria-label={isEn ? "Refresh notifications" : "Muat ulang notifikasi"}
              aria-busy={query.isFetching}
              className="px-3"
            >
              <RefreshCw
                className={`h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`}
                aria-hidden="true"
              />
            </Button>
            <Button
              type="button"
              variant="outline"
              icon={CheckCheck}
              loading={markAll.isPending}
              disabled={!unreadCount || markAll.isPending}
              onClick={handleMarkAll}
            >
              {t("common.mark_all_read")}
            </Button>
          </>
        }
      />

      {/* Filter Status & Counter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label={isEn ? "Filter notifications" : "Filter notifikasi"}
          className="inline-flex rounded-xl border border-gray-200/90 bg-white p-1 dark:border-gray-800 dark:bg-gray-900"
        >
          <button
            type="button"
            role="tab"
            aria-selected={!unreadOnly}
            onClick={() => handleFilterChange(false)}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors ${
              !unreadOnly
                ? "bg-primary-600 text-white shadow-sm dark:bg-primary-500"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            {t("common.all")}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={unreadOnly}
            onClick={() => handleFilterChange(true)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors ${
              unreadOnly
                ? "bg-primary-600 text-white shadow-sm dark:bg-primary-500"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            <span>{isEn ? "Unread" : "Belum dibaca"}</span>
            {unreadCount > 0 && (
              <span
                className={`tabular-nums-finance rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none ${
                  unreadOnly
                    ? "bg-white/20 text-white"
                    : "bg-primary-100 text-primary-700 dark:bg-primary-900/60 dark:text-primary-300"
                }`}
              >
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        <span className="tabular-nums-finance text-xs text-gray-500 dark:text-gray-400">
          {isEn ? "Unread" : "Belum dibaca"}:{" "}
          <strong className="font-semibold text-gray-800 dark:text-gray-200">
            {unreadCount}
          </strong>
        </span>
      </div>

      {/* Daftar Notifikasi */}
      <Card padding={false}>
        {query.isLoading ? (
          <div className="p-5">
            <SkeletonLoader variant="table" />
          </div>
        ) : query.isError ? (
          <ErrorState
            message={
              apiMessage(t, query.error) ||
              (isEn ? "Failed to load notifications." : "Gagal memuat notifikasi.")
            }
            onRetry={() => query.refetch()}
            retryText={t("common.retry")}
          />
        ) : items.length === 0 ? (
          <EmptyState
            icon={Bell}
            title={
              unreadOnly
                ? isEn
                  ? "No unread notifications"
                  : "Tidak ada notifikasi yang belum dibaca"
                : t("common.no_notifications")
            }
            description={
              unreadOnly
                ? isEn
                  ? "You are all caught up."
                  : "Semua notifikasi Anda sudah terbaca."
                : isEn
                ? "Budget alerts and savings goal completions will appear here."
                : "Peringatan anggaran dan pencapaian target tabungan akan tampil di sini."
            }
            actionText={unreadOnly ? (isEn ? "Show all" : "Lihat semua") : null}
            onAction={unreadOnly ? () => handleFilterChange(false) : null}
            className="py-12"
          />
        ) : (
          <ul
            aria-label={t("nav.notifications")}
            className="divide-y divide-gray-100 dark:divide-gray-800/80"
          >
            {items.map((item) => {
              const info = getNotificationMeta(item, isEn);
              const ItemIcon = info.icon;
              const isMarkingThis = markOne.isPending && markingId === item.id;
              const formattedDate = item.createdAt
                ? new Date(item.createdAt).toLocaleString(locale, {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "—";

              return (
                <li
                  key={item.id}
                  className={`flex flex-col gap-3 p-4 transition-colors sm:flex-row sm:items-start sm:justify-between ${
                    !item.isRead
                      ? "bg-primary-50/40 dark:bg-primary-950/20"
                      : "hover:bg-gray-50/70 dark:hover:bg-gray-800/30"
                  }`}
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${info.iconBg}`}
                      aria-hidden="true"
                    >
                      <ItemIcon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <Badge variant={info.badgeVariant} size="sm">
                          {info.badgeLabel}
                        </Badge>
                        {!item.isRead && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary-600 dark:text-primary-400">
                            <span
                              className="h-1.5 w-1.5 rounded-full bg-primary-600 dark:bg-primary-400"
                              aria-hidden="true"
                            />
                            {isEn ? "Unread" : "Baru"}
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-sm leading-relaxed ${
                          !item.isRead
                            ? "font-semibold text-gray-900 dark:text-white"
                            : "text-gray-700 dark:text-gray-200"
                        }`}
                      >
                        {info.message}
                      </p>
                      <p className="tabular-nums-finance mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {formattedDate}
                      </p>
                    </div>
                  </div>

                  {!item.isRead && (
                    <div className="flex-shrink-0 self-end sm:self-center">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        icon={Check}
                        loading={isMarkingThis}
                        disabled={markOne.isPending}
                        onClick={() => handleMarkOne(item.id)}
                        className="text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-950/50"
                      >
                        {isEn ? "Mark read" : "Tandai terbaca"}
                      </Button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {meta.total > 0 && items.length > 0 && (
          <div className="px-4 pb-4 sm:px-5">
            <Pagination
              page={meta.page ?? page}
              totalPages={meta.totalPages ?? 1}
              total={meta.total}
              limit={meta.limit ?? LIMIT}
              onPageChange={setPage}
              labels={{
                showing: t("transactions.showing"),
                pageOf: t("transactions.page_of"),
                prev: t("transactions.prev"),
                next: t("transactions.next"),
              }}
            />
          </div>
        )}
      </Card>
    </div>
  );
}