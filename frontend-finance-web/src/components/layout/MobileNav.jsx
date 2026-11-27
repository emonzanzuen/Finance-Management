import React, { useState, useEffect, useRef } from "react";
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
  Menu,
  X,
  TrendingUp,
  Bell,
  FileSpreadsheet,
} from "lucide-react";
import { gsap } from "gsap";

const menuItems = [
  { path: "/", icon: LayoutDashboard, labelKey: "dashboard" },
  { path: "/transactions", icon: Wallet, labelKey: "transactions" },
  { path: "/categories", icon: Tags, labelKey: "categories" },
  { path: "/budget", icon: TrendingUp, labelKey: "budget" },
  { path: "/savings", icon: Target, labelKey: "savings" },
  { path: "/reports", icon: BarChart3, labelKey: "reports" },
  { path: "/notifications", icon: Bell, labelKey: "notifications" },
  { path: "/imports", icon: FileSpreadsheet, labelKey: "import" },
  { path: "/scan-receipt", icon: Wallet, labelKey: "scan_receipt" },
  { path: "/profile", icon: User, labelKey: "profile" },
  { path: "/settings", icon: Settings, labelKey: "settings" },
];

const MobileNav = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { t } = useTranslation();
  const drawerRef = useRef(null);

  // Tutup drawer saat pindah halaman
  useEffect(() => {
    setIsDrawerOpen(false);
  }, [location.pathname]);

  // Tutup drawer dengan tombol Escape
  useEffect(() => {
    if (!isDrawerOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDrawerOpen]);

  // Animasi GSAP untuk drawer dengan dukungan reduced motion
  useEffect(() => {
    if (!isDrawerOpen || !drawerRef.current) return;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".mobile-nav-item",
        { opacity: 0, x: -14 },
        {
          opacity: 1,
          x: 0,
          duration: 0.25,
          stagger: 0.03,
          ease: "power2.out",
          clearProps: "transform,opacity",
        }
      );
    }, drawerRef);

    return () => ctx.revert();
  }, [isDrawerOpen]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const toggleDrawer = () => {
    setIsDrawerOpen((prev) => !prev);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };

  const isActivePath = (path) => location.pathname === path;

  return (
    <>
      {/* Overlay */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]"
          onClick={closeDrawer}
          aria-hidden="true"
        />
      )}

      {/* Bottom Navigation Bar */}
      <nav
        aria-label="Navigasi bawah"
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200/90 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md dark:border-gray-800/90 dark:bg-gray-900/95 md:hidden"
      >
        <div className="flex items-center justify-around px-2 py-1.5">
          {menuItems.slice(0, 4).map((item) => {
            const active = isActivePath(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                aria-current={active ? "page" : undefined}
                className={`flex min-w-[56px] flex-col items-center gap-0.5 rounded-xl px-2.5 py-1.5 transition-colors duration-200 ${
                  active
                    ? "text-primary-600 dark:text-primary-400"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                <item.icon className="h-5 w-5" aria-hidden="true" />
                <span className="text-[10px] font-medium leading-tight">
                  {t(`nav.${item.labelKey}`)}
                </span>
              </NavLink>
            );
          })}
          <button
            type="button"
            onClick={toggleDrawer}
            aria-expanded={isDrawerOpen}
            aria-controls="mobile-more-drawer"
            aria-label={t("nav.more") || "Menu lainnya"}
            className={`flex min-w-[56px] flex-col items-center gap-0.5 rounded-xl px-2.5 py-1.5 transition-colors duration-200 ${
              isDrawerOpen
                ? "text-primary-600 dark:text-primary-400"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
            <span className="text-[10px] font-medium leading-tight">
              {t("nav.more")}
            </span>
          </button>
        </div>
      </nav>

      {/* Drawer */}
      {isDrawerOpen && (
        <div
          id="mobile-more-drawer"
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-label={t("nav.more") || "Menu lainnya"}
          className="fixed bottom-16 left-0 right-0 z-50 max-h-[70vh] overflow-y-auto rounded-t-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900 md:hidden"
        >
          <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl border-b border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 shadow-sm">
                <TrendingUp className="h-4 w-4 text-white" aria-hidden="true" />
              </div>
              <span className="font-bold tracking-tight text-gray-900 dark:text-white">
                {t("app.name")}
              </span>
            </div>
            <button
              type="button"
              onClick={closeDrawer}
              aria-label={t("common.close") || "Tutup menu"}
              className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <div className="space-y-1 bg-white p-4 pb-6 dark:bg-gray-900">
            {menuItems.map((item) => {
              const active = isActivePath(item.path);
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={closeDrawer}
                  aria-current={active ? "page" : undefined}
                  className={`mobile-nav-item flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-colors duration-200 ${
                    active
                      ? "bg-primary-50 font-semibold text-primary-700 dark:bg-primary-950 dark:text-primary-400"
                      : "font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  }`}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                  <span>{t(`nav.${item.labelKey}`)}</span>
                  {active && (
                    <div
                      className="ml-auto h-6 w-1.5 flex-shrink-0 rounded-full bg-primary-600"
                      aria-hidden="true"
                    />
                  )}
                </NavLink>
              );
            })}

            <div className="my-2 border-t border-gray-200 dark:border-gray-800" />

            <button
              type="button"
              onClick={handleLogout}
              className="mobile-nav-item flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 transition-colors duration-200 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50"
            >
              <LogOut className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
              <span>{t("auth.logout")}</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileNav;