import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import MobileNav from "../components/layout/MobileNav";
import { useTranslation } from "../hooks/useTranslation";
import { gsap } from "gsap";

const MainLayout = () => {
  const { t } = useTranslation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile);
      setIsReady(true);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  useEffect(() => {
    if (isReady) {
      gsap.from(".page-content", {
        opacity: 0,
        y: 20,
        duration: 0.4,
        ease: "power2.out",
      });
    }
  }, [location, isReady]);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // Desktop: sidebar width
  const sidebarWidth = isSidebarOpen ? 280 : 80;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 overflow-x-hidden">
      {/* ===== DESKTOP ===== */}
      <div className="hidden md:block">
        {/* Sidebar - fixed */}
        <div className="fixed top-0 left-0 h-screen z-40">
          <Sidebar
            isOpen={isSidebarOpen}
            setIsOpen={setIsSidebarOpen}
            isMobile={false}
          />
        </div>

        {/* Header - fixed, margin left mengikuti sidebar */}
        <div
          className="fixed top-0 right-0 z-30 transition-all duration-300"
          style={{ left: sidebarWidth }}
        >
          <Navbar
            toggleSidebar={toggleSidebar}
            isSidebarOpen={isSidebarOpen}
            isMobile={false}
          />
        </div>

        {/* Main Content - padding top = header height, padding left = sidebar width */}
        <main
          className="min-h-screen transition-all duration-300"
          style={{
            paddingTop: "64px", // h-16
            paddingLeft: sidebarWidth,
          }}
        >
          <div className="p-4 md:p-6 lg:p-8 page-content">
            <Outlet />
          </div>
        </main>
      </div>

      {/* ===== MOBILE ===== */}
      <div className="md:hidden flex flex-col min-h-screen">
        {/* Header - fixed di mobile, tanpa hamburger */}
        <div className="fixed top-0 left-0 right-0 z-30">
          <Navbar
            toggleSidebar={null}
            isSidebarOpen={false}
            isMobile={true}
          />
        </div>

        {/* Main Content - padding top = header height, padding bottom = bottom nav */}
        <main className="flex-1 pt-16 pb-20">
          <div className="p-4 page-content">
            <Outlet />
          </div>
        </main>

        {/* Bottom Navigation */}
        <MobileNav />
      </div>
    </div>
  );
};

export default MainLayout;