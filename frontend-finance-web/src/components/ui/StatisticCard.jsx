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
  animate = true
}) => {
  const cardRef = useRef(null);

  useEffect(() => {
    if (animate && cardRef.current) {
      gsap.from(cardRef.current, {
        opacity: 0,
        y: 20,
        duration: 0.6,
        ease: "power2.out",
        delay: 0.1,
      });
    }
  }, [animate]);

  const colorClasses = {
    primary: {
      bg: "bg-primary-50 dark:bg-primary-950",
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

  return (
    <div ref={cardRef} className={`card card-hover ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1 truncate">
            {formatValue(value)}
          </p>
          {trend !== null && trend !== undefined && (
            <div className="flex items-center gap-1 mt-1">
              <span className={`text-sm font-medium ${trend > 0 ? "text-success" : "text-danger"}`}>
                {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
              </span>
              {trendLabel && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {trendLabel}
                </span>
              )}
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${colorClasses[color].bg} flex-shrink-0 ml-3`}>
          {Icon && <Icon className={`w-5 h-5 ${colorClasses[color].icon}`} />}
        </div>
      </div>
    </div>
  );
};

export default StatisticCard;