import React from "react";
import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { formatCurrency } from "../../utils/formatters";

const AreaChart = ({
  data,
  dataKey = "value",
  xAxisKey = "name",
  colors = ["#6366f1"],
  height = 300,
  showGrid = true,
  showLegend = false,
  showTooltip = true,
  className = "",
  strokeWidth = 2,
  fillOpacity = 0.2,
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <p className="text-gray-400 text-sm">Tidak ada data</p>
      </div>
    );
  }

  const isMultiSeries = Array.isArray(dataKey);

  return (
    <ResponsiveContainer width="100%" height={height} className={className}>
      <RechartsAreaChart
        data={data}
        margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
      >
        {showGrid && (
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
        )}
        <XAxis
          dataKey={xAxisKey}
          tick={{ fontSize: 12, fill: "#6b7280" }}
          axisLine={{ stroke: "#e5e7eb" }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(value) => formatCurrency(value)}
          tick={{ fontSize: 12, fill: "#6b7280" }}
          axisLine={{ stroke: "#e5e7eb" }}
          tickLine={false}
          width={80}
        />
        {showTooltip && (
          <Tooltip
            formatter={(value) => formatCurrency(value)}
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "8px 12px",
            }}
          />
        )}
        {showLegend && (
          <Legend
            verticalAlign="top"
            height={36}
            formatter={(value) => (
              <span className="text-sm text-gray-700 dark:text-gray-300">{value}</span>
            )}
          />
        )}
        {isMultiSeries ? (
          dataKey.map((key, index) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              stroke={colors[index % colors.length]}
              strokeWidth={strokeWidth}
              fill={colors[index % colors.length]}
              fillOpacity={fillOpacity}
            />
          ))
        ) : (
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={colors[0]}
            strokeWidth={strokeWidth}
            fill={colors[0]}
            fillOpacity={fillOpacity}
          />
        )}
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
};

export default AreaChart;