import { Portfolio } from "@/types/crypto";
import { PortfolioCard } from "./PortfolioCard"; // Your existing card component
import { fetchCryptoAssets } from "@/lib/cryptoData";
import { fetchStockAssets } from "@/lib/stockData";
import { useQuery } from "@tanstack/react-query";
import { isEmpty } from "lodash";
import { isCrypto, parseSymbol } from "./parseSymbol";
import { useState, useEffect, useCallback, useMemo } from "react";

interface PortfolioListProps {
  portfolios: Portfolio[];
  onRemove: (name: string) => void;
  onValueUpdate: (name: string, value: number) => void;
}

export function PortfolioList({
  portfolios,
  onRemove,
  onValueUpdate,
}: PortfolioListProps) {
  const [portfolioValues, setPortfolioValues] = useState<
    Record<string, number>
  >({});

  const sortedPortfolios = [...portfolios].sort((a, b) => {
    return (portfolioValues[b.Name] || 0) - (portfolioValues[a.Name] || 0);
  });

  const handleValueUpdate = useCallback(
    (portfolioName: string, value: number) => {
      setPortfolioValues((prev) => {
        // Only update if the value has changed
        if (prev[portfolioName] === value) {
          return prev;
        }
        onValueUpdate(portfolioName, value);
        return {
          ...prev,
          [portfolioName]: value,
        };
      });
    },
    [],
  ); // No dependencies needed since we're using the function form of setState

  return sortedPortfolios.map((portfolio) => (
    <PortfolioCardWrapper
      key={portfolio.Name}
      portfolio={portfolio}
      onRemove={() => onRemove(portfolio.Name)}
      onValueUpdate={handleValueUpdate}
    />
  ));
}

function PortfolioCardWrapper({
  portfolio,
  onRemove,
  onValueUpdate,
}: {
  portfolio: Portfolio;
  onRemove: () => void;
  onValueUpdate: (name: string, value: number) => void;
}) {
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

  useEffect(() => {
    if (totalValue !== undefined) {
      onValueUpdate(portfolio.Name, totalValue);
    }
  }, [totalValue, portfolio.Name, onValueUpdate]);

  if (!assetsWithAmount || totalValue === undefined) return null;

  return (
    <PortfolioCard
      name={portfolio.Name}
      assets={assetsWithAmount}
      totalValue={totalValue}
      onRemove={onRemove}
    />
  );
}
