import React, { useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "../../hooks/useTranslation";
import {
  LayoutDashboard,
  Wallet,
  Tags,
  Target,
  BarChart3,
  User,
  Settings,
  LogOut,
  X,
  TrendingUp,
  Bell,
  FileSpreadsheet,
  Receipt,
} from "lucide-react";
import toast from "react-hot-toast";

const menuItems = [
  { path: "/", icon: LayoutDashboard, labelKey: "nav.dashboard" },
  { path: "/transactions", icon: Wallet, labelKey: "nav.transactions" },
  { path: "/categories", icon: Tags, labelKey: "nav.categories" },
  { path: "/budget", icon: TrendingUp, labelKey: "nav.budget" },
  { path: "/savings", icon: Target, labelKey: "nav.savings" },
  { path: "/reports", icon: BarChart3, labelKey: "nav.reports" },
  { path: "/notifications", icon: Bell, labelKey: "common.notifications" },
  { path: "/imports", icon: FileSpreadsheet, labelKey: "nav.import" },
  { path: "/scan-receipt", icon: Receipt, labelKey: "nav.scan_receipt" },
  { path: "/profile", icon: User, labelKey: "nav.profile" },
  { path: "/settings", icon: Settings, labelKey: "nav.settings" },
];

const Sidebar = ({ isOpen, setIsOpen, isMobile }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    if (!isMobile || !isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobile, isOpen, setIsOpen]);

  const handleLogout = () => {
    logout();
    toast.success(t("auth.logout_success") || "Berhasil keluar!");
    navigate("/login", { replace: true });
  };

  const handleLinkClick = () => {
    if (isMobile) {
      setIsOpen(false);
    }
  };

  const isIconOnly = !isMobile && !isOpen;

  // Mobile Drawer
  if (isMobile) {
    return (
      <>
        {isOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
        )}
        <aside
          aria-label="Sidebar navigation"
          className={`fixed top-0 left-0 z-50 flex h-full w-72 flex-col border-r border-gray-200 bg-white transition-transform duration-300 ease-in-out dark:border-gray-800 dark:bg-gray-900 ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-16 flex-shrink-0 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-800">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-sm">
                <TrendingUp className="h-5 w-5 text-white" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-bold leading-tight tracking-tight text-gray-900 dark:text-white">
                  {t("app.name")}
                </p>
                <p className="truncate text-[11px] leading-tight text-gray-500 dark:text-gray-400">
                  {t("app.tagline")}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label={t("common.close") || "Tutup menu"}
              className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <nav
            aria-label="Menu utama"
            className="scrollbar-thin flex-1 space-y-0.5 overflow-y-auto px-3 py-2.5"
          >
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={handleLinkClick}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 ${
                    isActive
                      ? "bg-primary-50 font-semibold text-primary-700 dark:bg-primary-950 dark:text-primary-400"
                      : "font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                  }`}
                >
                  <item.icon className="h-[18px] w-[18px] flex-shrink-0" aria-hidden="true" />
                  <span className="truncate">{t(item.labelKey)}</span>
                  {isActive && (
                    <div
                      className="ml-auto h-5 w-1 flex-shrink-0 rounded-full bg-primary-600"
                      aria-hidden="true"
                    />
                  )}
                </NavLink>
              );
            })}
          </nav>

          <div className="flex-shrink-0 border-t border-gray-200 p-2.5 dark:border-gray-800">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition-all duration-200 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50"
            >
              <LogOut className="h-[18px] w-[18px] flex-shrink-0" aria-hidden="true" />
              <span>{t("auth.logout")}</span>
            </button>
          </div>
        </aside>
      </>
    );
  }

  // Desktop
  return (
    <aside
      id="desktop-sidebar"
      aria-label="Sidebar navigation"
      className={`flex h-full flex-col border-r border-gray-200/90 bg-white transition-[width] duration-300 ease-in-out dark:border-gray-800/90 dark:bg-gray-900 ${
        isOpen ? "w-64" : "w-[72px]"
      }`}
    >
      <div
        className={`flex h-16 flex-shrink-0 items-center border-b border-gray-200/90 dark:border-gray-800/90 ${
          isIconOnly ? "justify-center px-2" : "justify-between px-4"
        }`}
      >
        {!isIconOnly ? (
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-sm">
              <TrendingUp className="h-5 w-5 text-white" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-bold leading-tight tracking-tight text-gray-900 dark:text-white">
                {t("app.name")}
              </p>
              <p className="truncate text-[11px] leading-tight text-gray-500 dark:text-gray-400">
                {t("app.tagline")}
              </p>
            </div>
          </div>
        ) : (
          <div
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-sm"
            title={t("app.name")}
          >
            <TrendingUp className="h-5 w-5 text-white" aria-hidden="true" />
          </div>
        )}
      </div>

      <nav
        aria-label="Menu utama"
        className={`flex-1 space-y-0.5 overflow-y-auto py-2 ${
          isIconOnly ? "scrollbar-hide px-2" : "scrollbar-thin px-2.5"
        }`}
      >
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const label = t(item.labelKey);
          return (
            <NavLink
              key={item.path}
              to={item.path}
              aria-current={isActive ? "page" : undefined}
              aria-label={isIconOnly ? label : undefined}
              title={isIconOnly ? label : undefined}
              className={`group relative flex items-center rounded-xl text-[13.5px] transition-all duration-200 ${
                isIconOnly
                  ? "mx-auto h-9 w-10 justify-center p-0"
                  : "gap-3 px-3 py-2"
              } ${
                isActive
                  ? "bg-primary-50 font-semibold text-primary-700 dark:bg-primary-950 dark:text-primary-400"
                  : "font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
              }`}
            >
              <item.icon className="h-[18px] w-[18px] flex-shrink-0" aria-hidden="true" />
              {!isIconOnly && (
                <span className="truncate whitespace-nowrap">{label}</span>
              )}
              {isActive && !isIconOnly && (
                <div
                  className="ml-auto h-5 w-1 flex-shrink-0 rounded-full bg-primary-600"
                  aria-hidden="true"
                />
              )}
            </NavLink>
          );
        })}
      </nav>

      <div
        className={`flex-shrink-0 border-t border-gray-200/90 dark:border-gray-800/90 ${
          isIconOnly ? "p-2" : "p-2.5"
        }`}
      >
        <button
          type="button"
          onClick={handleLogout}
          aria-label={isIconOnly ? t("auth.logout") : undefined}
          title={isIconOnly ? t("auth.logout") : undefined}
          className={`group flex items-center rounded-xl text-[13.5px] font-medium text-red-600 transition-all duration-200 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50 ${
            isIconOnly
              ? "mx-auto h-9 w-10 justify-center p-0"
              : "w-full gap-3 px-3 py-2"
          }`}
        >
          <LogOut className="h-[18px] w-[18px] flex-shrink-0" aria-hidden="true" />
          {!isIconOnly && <span>{t("auth.logout")}</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;