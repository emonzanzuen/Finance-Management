import React from "react";
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

  const handleLogout = () => {
    logout();
    toast.success(t('auth.logout_success') || "Berhasil keluar!");
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
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsOpen(false)}
          />
        )}
        <aside
          className={`fixed top-0 left-0 h-full w-72 z-50 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-transform duration-300 ease-in-out ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                  {t('app.name')}
                </h1>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">
                  {t('app.tagline')}
                </p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={handleLinkClick}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-400"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium text-sm">{t(item.labelKey)}</span>
                  {isActive && <div className="ml-auto w-1 h-6 rounded-full bg-primary-600" />}
                </NavLink>
              );
            })}
          </nav>
          <div className="p-3 border-t border-gray-200 dark:border-gray-800 flex-shrink-0">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-all duration-200"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium text-sm">{t('auth.logout')}</span>
            </button>
          </div>
        </aside>
      </>
    );
  }

  // Desktop
  return (
    <aside
      className={`h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-all duration-300 ease-in-out ${
        isOpen ? "w-72" : "w-20"
      }`}
    >
      <div
        className={`flex items-center h-16 px-4 border-b border-gray-200 dark:border-gray-800 ${
          isIconOnly ? "justify-center" : "justify-between"
        } flex-shrink-0`}
      >
        {!isIconOnly ? (
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight truncate">
                {t('app.name')}
              </h1>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight truncate">
                {t('app.tagline')}
              </p>
            </div>
          </div>
        ) : (
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? "bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-400"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              } ${isIconOnly ? "justify-center" : ""} group relative`}
              title={isIconOnly ? t(item.labelKey) : ""}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!isIconOnly && <span className="font-medium text-sm whitespace-nowrap">{t(item.labelKey)}</span>}
              {isActive && !isIconOnly && <div className="ml-auto w-1 h-6 rounded-full bg-primary-600 flex-shrink-0" />}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-gray-200 dark:border-gray-800 flex-shrink-0">
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-all duration-200 ${
            isIconOnly ? "justify-center" : ""
          } group`}
          title={isIconOnly ? t('auth.logout') : ""}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!isIconOnly && <span className="font-medium text-sm">{t('auth.logout')}</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
