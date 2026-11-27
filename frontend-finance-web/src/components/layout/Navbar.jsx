import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Bell, Menu, Moon, Sun } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useApp } from "../../context/AppContext";
import { useNotifications } from "../../hooks/queries";
import { useTranslation } from "../../hooks/useTranslation";

const Navbar = ({ toggleSidebar, isSidebarOpen, isMobile }) => {
  const { user } = useAuth(); const location = useLocation(); const { isDark, toggleTheme } = useTheme(); const { t } = useTranslation(); const { currency } = useApp();
  const { data } = useNotifications({ page: 1, limit: 1 }); const unreadCount = data?.meta?.unreadCount ?? 0;
  const keys = { "/": "dashboard", "/transactions": "transactions", "/categories": "categories", "/budget": "budget", "/savings": "savings", "/reports": "reports", "/profile": "profile", "/settings": "settings", "/notifications": "notifications", "/imports": "import", "/scan-receipt": "transactions" };
  const title = t(`nav.${keys[location.pathname] || "dashboard"}`);
  const sidebarWidth = isMobile ? 0 : (isSidebarOpen ? 280 : 80);
  return <header className="fixed top-0 left-0 right-0 z-40 flex h-16 items-center border-b border-gray-200 bg-white px-4 transition-all dark:border-gray-800 dark:bg-gray-950 md:px-6" style={{ marginLeft: sidebarWidth }}><div className="flex w-full items-center justify-between"><div className="flex min-w-0 items-center gap-3">{!isMobile && <button onClick={toggleSidebar} className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800" aria-label={t("common.toggle_sidebar")}><Menu className="h-5 w-5"/></button>}<h1 className="truncate text-lg font-semibold">{title}</h1></div><div className="flex items-center gap-2"><button onClick={toggleTheme} className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800" aria-label={t("common.toggle_theme")}>{isDark ? <Sun className="h-5 w-5 text-yellow-400"/> : <Moon className="h-5 w-5"/>}</button><Link to="/notifications" className="relative rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Notifikasi"><Bell className="h-5 w-5"/>{unreadCount > 0 && <span className="absolute right-0.5 top-0.5 min-w-4 rounded-full bg-rose-500 px-1 text-center text-[10px] text-white">{unreadCount > 99 ? "99+" : unreadCount}</span>}</Link><Link to="/profile" className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800"><img className="h-8 w-8 rounded-full object-cover" src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "User")}&background=6366f1&color=fff&size=32`} alt=""/><span className="hidden max-w-40 truncate text-sm md:block">{user?.name || "User"}</span><span className="hidden rounded bg-gray-100 px-1.5 text-xs dark:bg-gray-800 sm:inline">{currency}</span></Link></div></div></header>;
};
export default Navbar;
