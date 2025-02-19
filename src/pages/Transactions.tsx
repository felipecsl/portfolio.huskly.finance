import { formatPrice } from "@/lib/utils/format";
import trades from "@/../trades.json";
import { Trade } from "@/types/trades";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";

// Define available asset types
const ASSET_TYPES = ["ALL", "OPTION", "FUTURE", "EQUITY"] as const;
type AssetType = (typeof ASSET_TYPES)[number];

const OPTION_TYPES = ["ALL", "PUT", "CALL"] as const;
type OptionType = (typeof OPTION_TYPES)[number];

const getPositionEffectColor = (effect: string | undefined) => {
  switch (effect) {
    case "OPENING":
      return "bg-blue-500/30 text-blue-300";
    case "CLOSING":
      return "bg-purple-500/30 text-purple-300";
    default:
      return "bg-stone-700 text-gray-300";
  }
};

export default function Transactions() {
  const navigate = useNavigate();
  const [symbolFilter, setSymbolFilter] = useState("");
  const [assetTypeFilter, setAssetTypeFilter] = useState<AssetType>("ALL");
  const [optionTypeFilter, setOptionTypeFilter] = useState<OptionType>("ALL");

  const getMainTransferItem = (trade: Trade) => {
    return trade.transferItems.find(
      (item) => !item.feeType && item.instrument.assetType !== "CURRENCY",
    );
  };

  const filteredAndSortedTrades = useMemo(
    () =>
      [...trades]
        .filter((trade) => {
          const mainItem = getMainTransferItem(trade);
          if (!mainItem) return false;

          const matchesSymbol = mainItem.instrument.symbol
            .toLowerCase()
            .includes(symbolFilter.toLowerCase());

          const matchesType =
            assetTypeFilter === "ALL" ||
            mainItem.instrument.assetType === assetTypeFilter;

          const matchesOptionType =
            assetTypeFilter !== "OPTION" ||
            optionTypeFilter === "ALL" ||
            mainItem.instrument.putCall === optionTypeFilter;

          return matchesSymbol && matchesType && matchesOptionType;
        })
        .sort(
          (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
        ),
    [symbolFilter, assetTypeFilter, optionTypeFilter],
  );

  const totalNetAmount = useMemo(() => {
    return filteredAndSortedTrades.reduce(
      (sum, trade) => sum + trade.netAmount,
      0,
    );
  }, [filteredAndSortedTrades]);

  return (
    <div className="min-h-screen p-8 bg-zinc-800">
      <div className="w-full max-w-7xl mx-auto">
        <button
          onClick={() => navigate("/")}
          className="mb-6 px-4 py-2 text-white bg-stone-900 rounded-lg border border-gray-950 hover:bg-stone-800 transition-colors"
        >
          ← Back to Portfolios
        </button>

        <div className="brutal-border bg-stone-900 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-medium text-white">
                Transaction History
              </h1>
              <div className="text-right">
                <div className="text-sm text-gray-400 mb-1">Net Total</div>
                <span
                  className={`text-2xl font-medium font-mono ${
                    totalNetAmount > 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {formatPrice(Math.abs(totalNetAmount))}
                </span>
              </div>
            </div>

            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Filter by symbol..."
                value={symbolFilter}
                onChange={(e) => setSymbolFilter(e.target.value)}
                className="flex-1 max-w-sm px-4 py-2 bg-stone-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:border-gray-600"
              />
              <select
                value={assetTypeFilter}
                onChange={(e) => {
                  setAssetTypeFilter(e.target.value as AssetType);
                  if (e.target.value !== "OPTION") {
                    setOptionTypeFilter("ALL");
                  }
                }}
                className="px-4 py-2 bg-stone-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:border-gray-600"
              >
                {ASSET_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type === "ALL"
                      ? "All Types"
                      : type.charAt(0) + type.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>

              {assetTypeFilter === "OPTION" && (
                <select
                  value={optionTypeFilter}
                  onChange={(e) =>
                    setOptionTypeFilter(e.target.value as OptionType)
                  }
                  className="px-4 py-2 bg-stone-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:border-gray-600"
                >
                  {OPTION_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type === "ALL" ? "All Options" : type}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-gray-800">
                  <th className="p-4 text-gray-400">Date</th>
                  <th className="p-4 text-gray-400">Type</th>
                  <th className="p-4 text-gray-400">Symbol</th>
                  <th className="p-4 text-gray-400">Description</th>
                  <th className="p-4 text-gray-400 text-right">Amount</th>
                  <th className="p-4 text-gray-400 text-right">Price</th>
                  <th className="p-4 text-gray-400 text-right">Net Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedTrades.map((trade) => {
                  const mainItem = getMainTransferItem(trade);
                  if (!mainItem) return null;

                  return (
                    <tr
                      key={trade.activityId}
                      className="border-b border-gray-800 hover:bg-stone-800"
                    >
                      <td className="p-4 text-gray-300">
                        {format(new Date(trade.time), "MMM d, yyyy")}
                      </td>
                      <td className="p-4 text-gray-300">
                        <span
                          className={`px-2 py-1 text-sm rounded ${getPositionEffectColor(
                            mainItem.positionEffect,
                          )}`}
                        >
                          {mainItem.positionEffect || trade.type}
                        </span>
                      </td>
                      <td className="p-4 text-gray-300 text-sm">
                        {mainItem.instrument.symbol}
                      </td>
                      <td className="p-4 text-gray-300 text-sm">
                        {mainItem.instrument.description}
                      </td>
                      <td className="p-4 text-gray-300 text-right font-mono">
                        {mainItem.amount.toLocaleString()}
                      </td>
                      <td className="p-4 text-gray-300 text-right font-mono">
                        {mainItem.price
                          ? formatPrice(mainItem.price)
                          : formatPrice(
                              Math.abs(mainItem.cost / mainItem.amount),
                            )}
                      </td>
                      <td className="p-4 text-right">
                        <span
                          className={`font-mono ${
                            trade.netAmount > 0
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {formatPrice(Math.abs(trade.netAmount))}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
