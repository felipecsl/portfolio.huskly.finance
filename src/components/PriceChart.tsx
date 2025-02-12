import { AssetHistory } from "@/types/crypto";
import { formatPrice } from "@/lib/utils/format";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface PriceChartProps {
  data: AssetHistory[];
}

export const PriceChart = ({ data }: PriceChartProps) => {
  return (
    <div className="h-[400px] w-full brutal-border bg-brutal-white p-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <XAxis
            dataKey="date"
            tickFormatter={(time) => new Date(time).toLocaleDateString()}
            stroke="#000000"
          />
          <YAxis
            tickFormatter={(value) => formatPrice(value)}
            stroke="#000000"
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const value = payload[0].value as number;
                return (
                  <div className="brutal-border bg-brutal-white p-2">
                    <p className="font-bold">{formatPrice(value)}</p>
                    <p className="text-sm">
                      {new Date(payload[0].payload.date).toLocaleDateString()}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="priceUsd"
            stroke="#FF6B35"
            fill="#FF6B35"
            fillOpacity={0.2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
