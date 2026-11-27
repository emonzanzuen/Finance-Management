import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Bell, Menu, Moon, Sun } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useApp } from "../../context/AppContext";
import { useNotifications } from "../../hooks/queries";
import { useTranslation } from "../../hooks/useTranslation";

const ROUTE_TITLE_KEYS = {
  "/": "dashboard",
  "/transactions": "transactions",
  "/categories": "categories",
  "/budget": "budget",
  "/savings": "savings",
  "/reports": "reports",
  "/profile": "profile",
  "/settings": "settings",
  "/notifications": "notifications",
  "/imports": "import",
  "/scan-receipt": "transactions",
};

const Navbar = ({ toggleSidebar, isSidebarOpen, isMobile }) => {
  const { user } = useAuth();
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const { currency } = useApp();
  const { data } = useNotifications({ page: 1, limit: 1 });

  const unreadCount = data?.meta?.unreadCount ?? 0;
  const titleKey = ROUTE_TITLE_KEYS[location.pathname] || "dashboard";
  const title = t(`nav.${titleKey}`);
  const userName = user?.name || "User";
  const avatarSrc =
    user?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=6366f1&color=fff&size=64`;

  return (
    <header className="flex h-16 w-full items-center border-b border-gray-200/90 bg-white/90 px-4 backdrop-blur-md transition-colors dark:border-gray-800/90 dark:bg-gray-950/90 md:px-6">
      <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-3">
        {/* Kiri: Toggle Sidebar (Desktop) & Judul Halaman */}
        <div className="flex min-w-0 items-center gap-3">
          {!isMobile && toggleSidebar && (
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label={t("common.toggle_sidebar") || "Toggle sidebar"}
              aria-expanded={isSidebarOpen}
              aria-controls="desktop-sidebar"
              className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
          )}
          <h1 className="truncate text-base font-semibold tracking-tight text-gray-900 dark:text-white sm:text-lg">
            {title}
          </h1>
        </div>

        {/* Kanan: Utilitas Theme, Notifikasi, Profil */}
        <div className="flex flex-shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={t("common.toggle_theme") || "Toggle theme"}
            aria-pressed={isDark}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
          >
            {isDark ? (
              <Sun className="h-5 w-5 text-yellow-400" aria-hidden="true" />
            ) : (
              <Moon className="h-5 w-5" aria-hidden="true" />
            )}
          </button>

          <Link
            to="/notifications"
            aria-label={
              unreadCount > 0
                ? `${t("nav.notifications") || "Notifikasi"} (${unreadCount})`
                : t("nav.notifications") || "Notifikasi"
            }
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
          >
            <Bell className="h-5 w-5" aria-hidden="true" />
            {unreadCount > 0 && (
              <span className="tabular-nums-finance absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-white dark:ring-gray-950">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>

          <div
            className="mx-1 hidden h-6 w-px bg-gray-200 dark:bg-gray-800 sm:block"
            aria-hidden="true"
          />

          <Link
            to="/profile"
            aria-label={`${t("nav.profile") || "Profil"}: ${userName}`}
            className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <img
              className="h-8 w-8 rounded-full object-cover ring-1 ring-gray-200 dark:ring-gray-700"
              src={avatarSrc}
              alt=""
            />
            <span className="hidden max-w-[140px] truncate text-sm font-medium text-gray-800 dark:text-gray-100 md:block">
              {userName}
            </span>
            <span className="tabular-nums-finance hidden rounded-md border border-gray-200 bg-gray-100 px-1.5 py-0.5 text-[11px] font-semibold tracking-wide text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 sm:inline">
              {currency}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Navbar;