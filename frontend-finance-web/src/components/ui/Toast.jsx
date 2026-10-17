import React, { useEffect } from "react";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { gsap } from "gsap";

const Toast = ({
  message,
  type = "info",
  duration = 3000,
  onClose,
  position = "top-right",
}) => {
  const toastRef = React.useRef(null);

  useEffect(() => {
    gsap.from(toastRef.current, {
      x: 50,
      opacity: 0,
      duration: 0.4,
      ease: "power2.out",
    });

    const timer = setTimeout(() => {
      gsap.to(toastRef.current, {
        x: 50,
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
        onComplete: onClose,
      });
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const variants = {
    success: {
      bg: "bg-emerald-500",
      icon: CheckCircle,
      iconBg: "bg-emerald-400/30",
    },
    error: {
      bg: "bg-rose-500",
      icon: AlertCircle,
      iconBg: "bg-rose-400/30",
    },
    warning: {
      bg: "bg-amber-500",
      icon: AlertTriangle,
      iconBg: "bg-amber-400/30",
    },
    info: {
      bg: "bg-indigo-500",
      icon: Info,
      iconBg: "bg-indigo-400/30",
    },
  };

  const Icon = variants[type].icon;

  return (
    <div
      ref={toastRef}
      className={`
        fixed z-50 top-4 right-4
        flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg
        text-white min-w-[280px] max-w-md
        ${variants[type].bg}
      `}
    >
      <div className={`p-1.5 rounded-lg ${variants[type].iconBg}`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={onClose}
        className="p-1 rounded-lg hover:bg-white/20 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;