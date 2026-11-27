import React, { useEffect, useRef } from "react";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { gsap } from "gsap";

const POSITIONS = {
  "top-right": "top-4 right-4",
  "top-left": "top-4 left-4",
  "bottom-right": "bottom-4 right-4",
  "bottom-left": "bottom-4 left-4",
  "top-center": "top-4 left-1/2 -translate-x-1/2",
  "bottom-center": "bottom-4 left-1/2 -translate-x-1/2",
};

const VARIANTS = {
  success: {
    bg: "bg-emerald-500",
    icon: CheckCircle,
    iconBg: "bg-emerald-400/30",
    role: "status",
    ariaLive: "polite",
  },
  error: {
    bg: "bg-rose-500",
    icon: AlertCircle,
    iconBg: "bg-rose-400/30",
    role: "alert",
    ariaLive: "assertive",
  },
  warning: {
    bg: "bg-amber-500",
    icon: AlertTriangle,
    iconBg: "bg-amber-400/30",
    role: "alert",
    ariaLive: "polite",
  },
  info: {
    bg: "bg-indigo-500",
    icon: Info,
    iconBg: "bg-indigo-400/30",
    role: "status",
    ariaLive: "polite",
  },
};

const Toast = ({
  message,
  type = "info",
  duration = 3000,
  onClose,
  position = "top-right",
}) => {
  const toastRef = useRef(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let ctx;
    if (!prefersReducedMotion && toastRef.current) {
      ctx = gsap.context(() => {
        gsap.fromTo(
          toastRef.current,
          { x: 32, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.28, ease: "power2.out" }
        );
      });
    }

    const timer = setTimeout(() => {
      if (!prefersReducedMotion && toastRef.current) {
        gsap.to(toastRef.current, {
          x: 32,
          opacity: 0,
          duration: 0.22,
          ease: "power2.in",
          onComplete: () => onClose?.(),
        });
      } else {
        onClose?.();
      }
    }, duration);

    return () => {
      clearTimeout(timer);
      ctx?.revert();
    };
  }, [duration, onClose]);

  const activeVariant = VARIANTS[type] || VARIANTS.info;
  const positionClass = POSITIONS[position] || POSITIONS["top-right"];
  const Icon = activeVariant.icon;

  return (
    <div
      ref={toastRef}
      role={activeVariant.role}
      aria-live={activeVariant.ariaLive}
      className={`fixed z-50 flex w-[calc(100vw-2rem)] max-w-md items-center gap-3 rounded-xl px-4 py-3 text-white shadow-lg ring-1 ring-black/10 sm:w-auto sm:min-w-[300px] ${positionClass} ${activeVariant.bg}`}
    >
      <div
        className={`flex-shrink-0 rounded-lg p-1.5 ${activeVariant.iconBg}`}
        aria-hidden="true"
      >
        <Icon className="h-4 w-4" />
      </div>
      <p className="min-w-0 flex-1 text-sm font-medium leading-snug">
        {message}
      </p>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup notifikasi"
          className="flex-shrink-0 rounded-lg p-1.5 text-white/90 transition-colors hover:bg-white/20 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
};

export default Toast;