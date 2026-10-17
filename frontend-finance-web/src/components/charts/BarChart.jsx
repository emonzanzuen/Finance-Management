import React from "react";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { formatCurrency } from "../../utils/formatters";

const BarChart = ({
  data,
  dataKey = "value",
  xAxisKey = "name",
  colors = ["#6366f1"],
  height = 300,
  showGrid = true,
  showLegend = false,
  showTooltip = true,
  borderRadius = 8,
  className = "",
  stacked = false,
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
      <RechartsBarChart
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
            cursor={{ fill: "#f3f4f6" }}
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
            <Bar
              key={key}
              dataKey={key}
              fill={colors[index % colors.length]}
              radius={[borderRadius, borderRadius, 0, 0]}
              stackId={stacked ? "stack" : undefined}
            />
          ))
        ) : (
          <Bar
            dataKey={dataKey}
            fill={colors[0]}
            radius={[borderRadius, borderRadius, 0, 0]}
          />
        )}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
};

export default BarChart;