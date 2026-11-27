import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";

const StatisticCard = ({
  title,
  value,
  icon: Icon,
  color = "primary",
  trend = null,
  trendLabel = "",
  className = "",
  animate = true,
}) => {
  const cardRef = useRef(null);

  useEffect(() => {
    if (!animate || !cardRef.current) return;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 14 },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          ease: "power2.out",
          clearProps: "transform,opacity",
        }
      );
    });

    return () => ctx.revert();
  }, [animate]);

  const colorClasses = {
    primary: {
      bg: "bg-primary-50 dark:bg-primary-950/70",
      icon: "text-primary-600 dark:text-primary-400",
    },
    success: {
      bg: "bg-success/10",
      icon: "text-success",
    },
    danger: {
      bg: "bg-danger/10",
      icon: "text-danger",
    },
    warning: {
      bg: "bg-warning/10",
      icon: "text-warning",
    },
    info: {
      bg: "bg-info/10",
      icon: "text-info",
    },
  };

  const activeColor = colorClasses[color] || colorClasses.primary;

  const formatValue = (val) => {
    if (typeof val === "number") {
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(val);
    }
    return val;
  };

  const isPositiveTrend = trend > 0;
  const isNeutralTrend = trend === 0;

  return (
    <div ref={cardRef} className={`card card-hover ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {title}
          </p>
          <p className="tabular-nums-finance mt-1.5 truncate text-xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-2xl">
            {formatValue(value)}
          </p>
          {trend !== null && trend !== undefined && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span
                className={`tabular-nums-finance inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-semibold ${
                  isNeutralTrend
                    ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                    : isPositiveTrend
                    ? "bg-success/10 text-success"
                    : "bg-danger/10 text-danger"
                }`}
              >
                {isNeutralTrend ? "•" : isPositiveTrend ? "↑" : "↓"}{" "}
                {Math.abs(trend)}%
              </span>
              {trendLabel && (
                <span className="truncate text-xs text-gray-500 dark:text-gray-400">
                  {trendLabel}
                </span>
              )}
            </div>
          )}
        </div>
        {Icon && (
          <div
            className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${activeColor.bg}`}
            aria-hidden="true"
          >
            <Icon className={`h-5 w-5 ${activeColor.icon}`} />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatisticCard;