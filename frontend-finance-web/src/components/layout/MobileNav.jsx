import React, { useState, useEffect } from "react";
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

  // Tutup drawer saat pindah halaman
  useEffect(() => {
    setIsDrawerOpen(false);
  }, [location]);

  // Animasi GSAP untuk drawer
  useEffect(() => {
    if (isDrawerOpen) {
      gsap.set(".mobile-nav-item", { opacity: 0, x: -20 });
      gsap.to(".mobile-nav-item", {
        opacity: 1,
        x: 0,
        duration: 0.4,
        stagger: 0.05,
        ease: "power2.out",
        delay: 0.1,
        clearProps: "opacity",
      });
    }
  }, [isDrawerOpen]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };

  // Helper untuk cek path aktif
  const isActivePath = (path) => location.pathname === path;

  return (
    <>
      {/* Overlay */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={closeDrawer}
        />
      )}

      {/* Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-around px-2 py-2">
          {menuItems.slice(0, 4).map((item) => {
            const active = isActivePath(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`
                  flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-all duration-200
                  ${active
                    ? "text-primary-600 dark:text-primary-400"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  }
                `}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{t(`nav.${item.labelKey}`)}</span>
              </NavLink>
            );
          })}
          <button
            onClick={toggleDrawer}
            className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] font-medium">{t('nav.more')}</span>
          </button>
        </div>
      </nav>

      {/* Drawer */}
      {isDrawerOpen && (
        <div className="fixed bottom-16 left-0 right-0 z-50 bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl border border-gray-200 dark:border-gray-800 md:hidden max-h-[70vh] overflow-y-auto">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-t-2xl sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-gray-900 dark:text-white">{t('app.name')}</span>
            </div>
            <button
              onClick={closeDrawer}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="p-4 space-y-1 bg-white dark:bg-gray-900 pb-6">
            {menuItems.map((item) => {
              const active = isActivePath(item.path);
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={closeDrawer}
                  className={`
                    mobile-nav-item flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                    ${active
                      ? "bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-400"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }
                  `}
                  style={{ opacity: 1 }}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium text-sm">{t(`nav.${item.labelKey}`)}</span>
                  {active && (
                    <div className="ml-auto w-1.5 h-6 rounded-full bg-primary-600 flex-shrink-0" />
                  )}
                </NavLink>
              );
            })}

            <div className="border-t border-gray-200 dark:border-gray-800 my-2" />

            <button
              onClick={handleLogout}
              className="mobile-nav-item flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-all duration-200"
              style={{ opacity: 1 }}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium text-sm">{t('auth.logout')}</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileNav;
