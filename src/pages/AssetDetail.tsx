import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { formatPrice } from "@/lib/utils/format";
import { PercentageChange } from "@/components/PercentageChange";
import {
  createChart,
  ColorType,
  IChartApi,
  ISeriesApi,
  LineStyle,
  AreaSeries,
} from "lightweight-charts";
import { useEffect, useRef, useState } from "react";
import { getFromCache, setCache } from "@/lib/cache";
import {
  fetchPriceHistory,
  fetchStockQuotes,
  PriceDataPoint,
} from "@/lib/stockData";
import { cryptoSymbols, isCrypto } from "@/lib/cryptoData";
interface ChartPeriod {
  days: number;
  label: string;
  frequency: number;
  frequencyType: "minute" | "daily" | "weekly";
}

const CHART_PERIODS: ChartPeriod[] = [
  { days: 1, label: "1D", frequency: 1, frequencyType: "minute" },
  { days: 5, label: "5D", frequency: 30, frequencyType: "minute" },
  { days: 30, label: "1M", frequency: 1, frequencyType: "daily" },
  { days: 180, label: "6M", frequency: 1, frequencyType: "daily" },
  { days: 365, label: "1Y", frequency: 1, frequencyType: "daily" },
  { days: 365 * 5, label: "5Y", frequency: 1, frequencyType: "weekly" },
];

interface AssetResponse {
  symbol: string;
  name: string;
  price: number;
  changePercent24h: number;
  type: "crypto" | "stock";
}

const AssetDetail = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<ChartPeriod>(
    CHART_PERIODS[0],
  );

  // Fetch current asset data
  const { data: asset, isLoading: assetLoading } = useQuery<
    AssetResponse,
    Error
  >({
    queryKey: ["asset", symbol],
    queryFn: async () => {
      if (!symbol) throw new Error("Symbol is required");

      // Try to get from cache first
      const cacheKey = `asset:${symbol}`;
      const cachedData = getFromCache<AssetResponse>(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      try {
        if (isCrypto(symbol)) {
          // Fetch crypto data from CoinCap
          const formattedSymbol = cryptoSymbols[symbol] || symbol.toLowerCase();
          const response = await fetch(
            `https://api.coincap.io/v2/assets/${formattedSymbol}`,
          );

          if (!response.ok) {
            throw new Error("Failed to fetch crypto data");
          }

          const data = await response.json();
          const result: AssetResponse = {
            symbol: data.data.symbol,
            name: data.data.name,
            price: parseFloat(data.data.priceUsd),
            changePercent24h: parseFloat(data.data.changePercent24Hr),
            type: "crypto",
          };

          return setCache(cacheKey, result);
        } else {
          // Fetch stock data using new batch quotes function
          const quotes = await fetchStockQuotes([symbol]);
          const quote = quotes.get(symbol);

          if (!quote) {
            throw new Error(`No quote data found for ${symbol}`);
          }

          const result: AssetResponse = {
            symbol: symbol,
            name: quote.name || symbol,
            price: quote.c,
            changePercent24h: quote.dp,
            type: "stock",
          };

          return setCache(cacheKey, result);
        }
      } catch (error) {
        console.error("Error fetching asset:", error);
        throw error;
      }
    },
    enabled: !!symbol,
    retry: false,
  });

  // Fetch historical data
  const { data: history, isLoading: historyLoading } = useQuery<
    PriceDataPoint[],
    Error
  >({
    queryKey: ["asset-history", symbol, selectedPeriod.days],
    queryFn: async () => {
      if (!symbol) throw new Error("Symbol is required");

      // Try to get from cache first
      const cacheKey = `asset-history:${symbol}:${selectedPeriod.days}`;
      const cachedData = getFromCache<PriceDataPoint[]>(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      try {
        const result = await fetchPriceHistory({
          symbol,
          isCrypto: isCrypto(symbol),
          cryptoId: isCrypto(symbol)
            ? cryptoSymbols[symbol] || symbol.toLowerCase()
            : undefined,
          days: selectedPeriod.days,
          frequency: selectedPeriod.frequency,
          frequencyType: selectedPeriod.frequencyType,
        });
        return setCache(cacheKey, result);
      } catch (error) {
        console.error("Error fetching history:", error);
        throw error;
      }
    },
    enabled: !!symbol && !!asset,
    retry: false,
  });

  useEffect(() => {
    if (!chartContainerRef.current || !history) return;

    // Calculate if price went up or down
    const firstPrice = history[0].price;
    const lastPrice = history[history.length - 1].price;
    const priceIncreased = lastPrice >= firstPrice;

    // Set colors based on price movement
    const lineColor = priceIncreased
      ? "rgb(74, 222, 128)"
      : "rgb(248, 113, 113)";
    const areaTopColor = priceIncreased
      ? "rgba(74, 222, 128, 0.3)"
      : "rgba(248, 113, 113, 0.3)";
    const areaBottomColor = priceIncreased
      ? "rgba(74, 222, 128, 0)"
      : "rgba(248, 113, 113, 0)";

    // Initialize chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "rgb(39, 38, 38)" },
        textColor: "white",
      },
      grid: {
        vertLines: {
          color: "rgba(197, 203, 206, 0.1)",
          style: LineStyle.Solid,
        },
        horzLines: {
          color: "rgba(197, 203, 206, 0.1)",
          style: LineStyle.Solid,
        },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });

    // Create the line series with dynamic colors
    const series = chart.addSeries(AreaSeries, {
      lineColor,
      topColor: areaTopColor,
      bottomColor: areaBottomColor,
      lineWidth: 2,
    });

    // Format data for the chart
    const chartData = history.map((item) => ({
      time: item.timestamp / 1000, // Convert to seconds
      value: item.price,
    }));

    series.setData(chartData);

    // Fit content and add margin
    chart.timeScale().fitContent();

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener("resize", handleResize);

    // Store chart reference for cleanup
    chartRef.current = chart;

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [history]);

  // Calculate percentage change for current time period
  const calculatePeriodChange = (priceHistory: PriceDataPoint[]) => {
    if (!priceHistory || priceHistory.length < 2) return 0;

    const firstPrice = priceHistory[0].price;
    const lastPrice = priceHistory[priceHistory.length - 1].price;

    return ((lastPrice - firstPrice) / firstPrice) * 100;
  };

  if (assetLoading) {
    return (
      <div className="min-h-screen p-8 bg-zinc-800 text-center">Loading...</div>
    );
  }

  if (!asset) {
    return (
      <div className="min-h-screen p-8 bg-zinc-800">
        <div className="w-full max-w-4xl mx-auto">
          <div className="brutal-border p-6 mb-8 rounded-lg text-center">
            <p className="text-xl">Asset not found: {symbol}</p>
            <p className="text-gray-400 mt-2">
              The requested asset could not be found.
            </p>
            <button
              onClick={() => navigate("/phinance")}
              className="mt-4 px-4 py-2 bg-blue-500 rounded hover:bg-blue-600"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-zinc-800">
      <div className="w-full max-w-4xl mx-auto">
        <div className="brutal-border p-6 mb-8 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-medium">{asset.name}</h1>
              <p className="text-gray-400">{asset.symbol}</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-medium mb-4">
                {formatPrice(+asset.price)}
              </div>
              <PercentageChange
                value={
                  history
                    ? calculatePeriodChange(history)
                    : +asset.changePercent24h
                }
              />
            </div>
          </div>

          {history && (
            <>
              <div className="flex gap-2 mb-4">
                {CHART_PERIODS.map((period) => (
                  <button
                    key={period.label}
                    onClick={() => setSelectedPeriod(period)}
                    className={`px-4 py-2 rounded ${
                      selectedPeriod.days === period.days
                        ? "bg-stone-600 text-white"
                        : "bg-stone-800 text-gray-300 hover:bg-stone-700"
                    }`}
                  >
                    {period.label}
                  </button>
                ))}
              </div>
              <div ref={chartContainerRef} className="h-[400px]" />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssetDetail;
