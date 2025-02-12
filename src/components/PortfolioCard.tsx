import { Portfolio } from "@/types/crypto";
import { formatPrice } from "@/lib/utils/format";
import { useQuery } from "@tanstack/react-query";
import { fetchCryptoAssets } from "@/lib/cryptoData";
import { PercentageChange } from "./PercentageChange";
import { useState } from "react";
import { AssetList } from "./AssetList";
import { isEmpty } from "lodash";
import { fetchStockAssets } from "@/lib/stockData";

interface PortfolioCardProps {
  portfolio: Portfolio;
  onRemove: () => void;
}

function isCrypto(holding: { Asset: { Symbol: string } }) {
  return holding.Asset.Symbol.includes(" : USD");
}

function parseSymbol(holding: { Asset: { Symbol: string } }) {
  if (!holding.Asset.Symbol || !holding.Asset.Symbol.includes(":")) {
    console.warn(`Invalid symbol`, holding);
    return "";
  }
  return isCrypto(holding)
    ? holding.Asset.Symbol.split(" : ")[0]
    : holding.Asset.Symbol.split(":")[1];
}

export function PortfolioCard({ portfolio, onRemove }: PortfolioCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: assets } = useQuery({
    queryKey: ["portfolio-assets", portfolio.Name],
    queryFn: async () => {
      const holdings = Object.values(portfolio.Holdings)
        .filter(
          (holding) =>
            !isEmpty(holding.Asset.Symbol) && +holding["Total Shares"] > 0,
        )
        .map((holding) => ({
          symbol: parseSymbol(holding),
          name: holding.Asset.Name,
          amount: Number(holding["Total Shares"]),
          type: isCrypto(holding) ? ("crypto" as const) : ("stock" as const),
        }));
      const stockAssets = holdings
        .filter((h) => h.type === "stock")
        .map((h) => h.symbol);
      const cryptoAssets = holdings
        .filter((h) => h.type === "crypto")
        .map((h) => h.symbol);
      const stockAssetQuotes = await fetchStockAssets(new Set(stockAssets));
      const cryptoAssetQuotes = await fetchCryptoAssets(new Set(cryptoAssets));
      return [...stockAssetQuotes, ...cryptoAssetQuotes];
    },
  });

  const totalValue = assets?.reduce((sum, asset) => {
    const holding = Object.values(portfolio.Holdings).find((h) =>
      h.Asset.Symbol.includes(asset.symbol),
    );
    if (!holding) return sum;
    return sum + Number(holding["Total Shares"]) * Number(asset.priceUsd);
  }, 0);

  // Transform assets to include amount from holdings
  const assetsWithAmount = assets?.map((asset) => {
    const holding = Object.values(portfolio.Holdings).find((h) =>
      h.Asset.Symbol.includes(asset.symbol),
    );
    return {
      ...asset,
      amount: holding ? Number(holding["Total Shares"]) : 0,
    };
  });

  return (
    <div className="p-6 bg-stone-800 text-gray-200 dark:bg-stone-800 hover:bg-stone-900 dark:text-brutal-white border-gray-950 border rounded drop-shadow-lg cursor-pointer">
      <div
        className="flex justify-between items-start mb-4"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div>
          <h2 className="text-2xl font-medium">{portfolio.Name}</h2>
          <p className="text-gray-400">
            {Object.keys(portfolio.Holdings).length} holdings
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-medium">
            {totalValue ? formatPrice(totalValue) : "Loading..."}
          </div>
          {!isEmpty(assets) && (
            <div className="mt-4">
              <PercentageChange
                value={
                  (assets.reduce((sum, asset) => {
                    const holding = Object.values(portfolio.Holdings).find(
                      (h) => h.Asset.Symbol.includes(asset.symbol),
                    );
                    if (!holding) return sum;
                    return (
                      sum +
                      (Number(holding["Total Shares"]) *
                        Number(asset.priceUsd) *
                        Number(asset.changePercent24Hr)) /
                        100
                    );
                  }, 0) /
                    totalValue!) *
                  100
                }
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-4 mb-4">
        <button
          onClick={onRemove}
          className="px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
        >
          Remove
        </button>
      </div>

      {isExpanded && assetsWithAmount && (
        <AssetList
          assets={assetsWithAmount}
          holdings={Object.values(portfolio.Holdings).map((h) => ({
            symbol: parseSymbol(h),
            name: h.Asset.Name,
            amount: +h["Total Shares"],
          }))}
        />
      )}
    </div>
  );
}
