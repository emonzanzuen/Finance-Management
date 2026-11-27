import React, { useState, useEffect, useRef } from "react";
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
  const desktopContentRef = useRef(null);
  const mobileContentRef = useRef(null);

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
    if (!isReady) return;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) return;

    const target = isMobile ? mobileContentRef.current : desktopContentRef.current;
    if (!target) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        target,
        { opacity: 0, y: 12 },
        {
          opacity: 1,
          y: 0,
          duration: 0.3,
          ease: "power2.out",
          clearProps: "transform,opacity",
        }
      );
    });

    return () => ctx.revert();
  }, [location.pathname, isReady, isMobile]);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  if (!isReady) {
    return (
      <div
        className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950"
        role="status"
        aria-live="polite"
      >
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("common.loading")}
          </p>
        </div>
      </div>
    );
  }

  // Sinkron dengan Sidebar: w-64 (256px) saat terbuka, w-[72px] (72px) saat ringkas
  const sidebarWidth = isSidebarOpen ? 256 : 72;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 overflow-x-hidden">
      <a href="#main-content" className="skip-link">
        {t("common.skip_to_content") || "Skip to main content"}
      </a>

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

        {/* Header - fixed, mengikuti lebar sidebar */}
        <div
          className="fixed top-0 right-0 z-30 transition-[left] duration-300 ease-in-out"
          style={{ left: sidebarWidth }}
        >
          <Navbar
            toggleSidebar={toggleSidebar}
            isSidebarOpen={isSidebarOpen}
            isMobile={false}
          />
        </div>

        {/* Main Content */}
        <main
          id={!isMobile ? "main-content" : undefined}
          tabIndex={-1}
          className="min-h-screen transition-[padding-left] duration-300 ease-in-out focus:outline-none"
          style={{
            paddingTop: "64px",
            paddingLeft: sidebarWidth,
          }}
        >
          <div
            ref={desktopContentRef}
            className="page-content mx-auto w-full max-w-[1440px] p-4 md:p-5 lg:p-6"
          >
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

        {/* Main Content */}
        <main
          id={isMobile ? "main-content" : undefined}
          tabIndex={-1}
          className="flex-1 pt-16 pb-24 focus:outline-none"
        >
          <div ref={mobileContentRef} className="page-content p-4">
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