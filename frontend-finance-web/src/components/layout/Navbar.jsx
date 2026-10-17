import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Menu, Bell, Moon, Sun, X, BellOff } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useApp } from "../../context/AppContext";
import { useTranslation } from "../../hooks/useTranslation";

const Navbar = ({ toggleSidebar, isSidebarOpen, isMobile }) => {
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const { 
    user, 
    notifications = [], 
    markNotificationAsRead = () => {}, 
    clearAllNotifications = () => {}, 
    unreadCount = 0,
    currency = 'IDR',
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);

  const getPageTitle = () => {
    const path = location.pathname;
    const titleMap = {
      '/': 'dashboard',
      '/transactions': 'transactions',
      '/categories': 'categories',
      '/budget': 'budget',
      '/savings': 'savings',
      '/reports': 'reports',
      '/profile': 'profile',
      '/settings': 'settings',
    };
    const key = titleMap[path] || 'dashboard';
    return t(`nav.${key}`);
  };

  const toggleNotifications = () => setShowNotifications(!showNotifications);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatTime = (dateString) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return t('common.just_now');
    if (minutes < 60) return `${minutes} ${t('common.minutes_ago')}`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ${t('common.hours_ago')}`;
    const days = Math.floor(hours / 24);
    return `${days} ${t('common.days_ago')}`;
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case "success": return "✅";
      case "warning": return "⚠️";
      case "error": return "❌";
      default: return "📌";
    }
  };

  const sidebarWidth = isMobile ? 0 : (isSidebarOpen ? 280 : 80);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 h-16 flex items-center px-4 md:px-6 transition-all duration-300 ease-in-out"
      style={{ marginLeft: sidebarWidth }}
    >
      <div className="flex items-center justify-between w-full">
        {/* LEFT */}
        <div className="flex items-center gap-3 min-w-0">
          {!isMobile && (
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
              aria-label={t('common.toggle_sidebar')}
            >
              <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          )}
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
            {getPageTitle()}
          </h1>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
          {/* Theme */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label={t('common.toggle_theme')}
          >
            {isDark ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
          </button>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={toggleNotifications}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative"
              aria-label={t('common.notifications')}
            >
              <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-950" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {t('common.notifications')}
                    {unreadCount > 0 && (
                      <span className="ml-2 text-xs bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded-full">
                        {unreadCount} {t('common.new')}
                      </span>
                    )}
                  </span>
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAllNotifications}
                      className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    >
                      {t('common.mark_all_read')}
                    </button>
                  )}
                </div>

                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                    <BellOff className="w-8 h-8 mb-2" />
                    <p className="text-sm">{t('common.no_notifications')}</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer ${
                          !notif.read ? "bg-primary-50/30 dark:bg-primary-950/20" : ""
                        }`}
                        onClick={() => markNotificationAsRead(notif.id)}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-lg">{getNotifIcon(notif.type)}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-700 dark:text-gray-300 break-words">
                              {notif.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">{formatTime(notif.createdAt)}</p>
                          </div>
                          {!notif.read && <span className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-1.5" />}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-2 ml-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg px-2 py-1.5 transition-colors group">
            <img
              src={
                user?.avatar ||
                `https://ui-avatars.com/api/?name=${user?.name || "User"}&background=6366f1&color=fff&size=32&bold=true`
              }
              alt={user?.name || "User"}
              className="w-8 h-8 rounded-full flex-shrink-0 border-2 border-transparent group-hover:border-primary-500 transition-colors"
            />
            <div className="hidden lg:block min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white leading-tight truncate">
                {user?.name || "User"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight truncate flex items-center gap-1">
                {user?.email || "user@example.com"}
                <span className="ml-1 px-1.5 py-0.5 text-[10px] font-mono bg-gray-100 dark:bg-gray-800 rounded-md text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                  {currency}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;