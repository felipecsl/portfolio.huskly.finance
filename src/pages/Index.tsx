import { useQuery } from "@tanstack/react-query";
import { Asset, UserHolding } from "@/types/crypto";
import { AssetList } from "@/components/AssetList";
import { formatPrice, formatPercentage } from "@/lib/utils/format";
import { useState } from "react";
import fidelity401k from "../../portfolios/fidelity401k.json";
import julipeschwab from "../../portfolios/julipe-schawb.json";
import iraschwab from "../../portfolios/ira-schwab.json";
import personalschwab from "../../portfolios/personal-schwab.json";
import crypto from "../../portfolios/crypto.json";
import ibkr from "../../portfolios/ibkr.json";
import { fetchStockAssets } from "@/lib/stockData";
import { getFromCache, setCache, CACHE_DURATION } from "@/lib/cache";
import { PercentageChange } from "@/components/PercentageChange";

export interface StockProfile {
  name: string;
}

interface StockQuote {
  c: number; // Current price
  dp: number; // Percent change
}

// Add type for portfolio source
type PortfolioSource =
  | "fidelity401k"
  | "julipeschwab"
  | "personalschwab"
  | "iraschwab"
  | "ibkr"
  | "crypto";

// Add this before the Index component
const portfolioNames = {
  fidelity401k: "Fidelity 401(k)",
  julipeschwab: "Julipe's Schwab",
  personalschwab: "Personal Schwab",
  iraschwab: "IRA Schwab",
  ibkr: "Interactive Brokers",
  crypto: "Crypto",
} as const;

async function parsePortfolioHoldings(
  source: PortfolioSource,
): Promise<UserHolding[]> {
  // Get portfolio data based on source
  let portfolio;

  if (source === "crypto") {
    portfolio = crypto;
    // Parse crypto holdings differently
    return Object.values(portfolio.Holdings).map((holding: any) => ({
      symbol: holding.Asset.Symbol.split(" : ")[0],
      name: holding.Asset.Name,
      amount: Number(holding["Total Shares"]),
      type: "crypto" as const,
      portfolioSource: source,
    }));
  }

  // Handle stock portfolios
  switch (source) {
    case "fidelity401k":
      portfolio = fidelity401k;
      break;
    case "julipeschwab":
      portfolio = julipeschwab;
      break;
    case "personalschwab":
      portfolio = personalschwab;
      break;
    case "iraschwab":
      portfolio = iraschwab;
      break;
    case "ibkr":
      portfolio = ibkr;
      break;
  }

  // Parse stock holdings for the selected portfolio
  const stockHoldings: UserHolding[] = Object.values(portfolio.Holdings)
    .filter(
      (holding: any) =>
        holding.Asset.Symbol &&
        holding.Asset.Symbol.match(/(NYSE|NASDAQ|NYSEARCA|BATS|MUTF):/),
    )
    .map((holding: any) => ({
      symbol: holding.Asset.Symbol.split(":")[1],
      name: holding.Asset.Name,
      amount: Number(holding["Total Shares"]),
      type: "stock" as const,
      portfolioSource: source,
    }))
    .filter((holding) => holding.amount > 0);

  return stockHoldings;
}

const Index = () => {
  // Replace portfolio type selection with portfolio source selection
  const savedSource =
    localStorage.getItem("selectedPortfolio") || "personalschwab";
  const [selectedPortfolio, setSelectedPortfolio] = useState<PortfolioSource>(
    savedSource as PortfolioSource,
  );

  // Save portfolio preference whenever it changes
  const handlePortfolioChange = (source: PortfolioSource) => {
    setSelectedPortfolio(source);
    localStorage.setItem("selectedPortfolio", source);
  };

  // Load all portfolio holdings first
  const { data: holdings = [] } = useQuery({
    queryKey: ["portfolio-holdings"],
    queryFn: async () => {
      const stockPortfolios = [
        "fidelity401k",
        "julipeschwab",
        "personalschwab",
        "iraschwab",
        "ibkr",
      ] as const;

      // Get stock holdings
      const stockHoldings = await Promise.all(
        stockPortfolios.map((source) => parsePortfolioHoldings(source)),
      );

      // Get crypto holdings separately
      const cryptoHoldings = await parsePortfolioHoldings("crypto");

      return [...stockHoldings.flat(), ...cryptoHoldings];
    },
  });

  // Load stock assets in background
  const { data: stockAssets = [] } = useQuery({
    queryKey: ["stock-assets-2"],
    queryFn: async () => {
      const stockHoldings = holdings.filter((h) => h.type === "stock");
      try {
        return await fetchStockAssets(stockHoldings);
      } catch (error) {
        console.error("Error fetching stock assets:", error);
        return [];
      }
    },
    enabled: holdings.length > 0,
    refetchInterval: CACHE_DURATION * 1000,
  });

  // Load crypto assets in background
  const { data: cryptoAssets = [] } = useQuery({
    queryKey: ["crypto-assets"],
    queryFn: async () => {
      const cached = getFromCache<Asset[]>("crypto-assets");
      if (cached) return cached;

      const response = await fetch("https://api.coincap.io/v2/assets");
      const data = await response.json();
      const assets = data.data.map((asset: Asset) => ({
        ...asset,
        type: "crypto",
      }));

      setCache("crypto-assets", assets);
      return assets;
    },
    refetchInterval: CACHE_DURATION * 1000,
  });

  // Combine all assets with both stocks and crypto
  const assets = [...stockAssets, ...cryptoAssets];

  // Filter assets for selected portfolio
  const selectedAssets = assets.filter((asset) => {
    const holding = holdings.find(
      (h) =>
        h.symbol === asset.symbol && h.portfolioSource === selectedPortfolio,
    );
    return holding && holding.amount > 0;
  });

  const calculateTotalValue = () => {
    if (!assets || !holdings) return 0;
    return holdings.reduce((total, holding) => {
      const asset = assets.find((a) => a.symbol === holding.symbol);
      if (asset) {
        return total + parseFloat(asset.priceUsd) * holding.amount;
      }
      return total;
    }, 0);
  };

  // Add function to calculate portfolio total
  const calculatePortfolioTotal = (portfolioSource: PortfolioSource) => {
    const portfolioHoldings = holdings.filter(
      (h) => h.portfolioSource === portfolioSource,
    );
    return portfolioHoldings.reduce((total, holding) => {
      const asset = assets.find((a) => a.symbol === holding.symbol);
      if (asset) {
        return total + parseFloat(asset.priceUsd) * holding.amount;
      }
      return total;
    }, 0);
  };

  // Add function to calculate portfolio 24h change
  const calculatePortfolioChange = (portfolioSource: PortfolioSource) => {
    const portfolioHoldings = holdings.filter(
      (h) => h.portfolioSource === portfolioSource,
    );

    let totalValue = 0;
    let totalPreviousValue = 0;

    portfolioHoldings.forEach((holding) => {
      const asset = assets.find((a) => a.symbol === holding.symbol);
      if (asset) {
        const currentPrice = parseFloat(asset.priceUsd);
        const changePercent = parseFloat(asset.changePercent24Hr) / 100;
        const previousPrice = currentPrice / (1 + changePercent);

        totalValue += currentPrice * holding.amount;
        totalPreviousValue += previousPrice * holding.amount;
      }
    });

    if (totalPreviousValue === 0) return 0;
    return ((totalValue - totalPreviousValue) / totalPreviousValue) * 100;
  };

  // Calculate grand total across all portfolios
  const grandTotal = calculateTotalValue();

  return (
    <div className="min-h-screen p-8 bg-zinc-800">
      <div className="w-full max-w-4xl mx-auto">
        {/* Grand Total Section */}
        <div className="mb-8 p-4 brutal-border">
          <div className="text-4xl font-medium">{formatPrice(grandTotal)}</div>
        </div>

        {/* Portfolio List Section */}
        <div className="grid grid-cols-1 gap-4 mb-8">
          {(
            [
              "crypto",
              "personalschwab",
              "fidelity401k",
              "julipeschwab",
              "iraschwab",
              "ibkr",
            ] as const
          ).map((source) => (
            <button
              key={source}
              onClick={() => handlePortfolioChange(source)}
              className={`brutal-border p-4 flex justify-between items-center ${
                selectedPortfolio === source
                  ? "bg-brutal-black text-brutal-white dark:bg-stone-900 dark:text-brutal-black rounded"
                  : "bg-stone-800 text-gray-200 hover:bg-stone-700 dark:bg-stone-800 dark:text-brutal-white border-gray-950 border rounded drop-shadow-lg"
              }`}
            >
              <span className="text-lg">{portfolioNames[source]}</span>
              <div className="flex items-center gap-6">
                <span className="text-xl font-medium">
                  {formatPrice(calculatePortfolioTotal(source))}
                </span>
                <PercentageChange value={calculatePortfolioChange(source)} />
              </div>
            </button>
          ))}
        </div>

        <AssetList
          assets={selectedAssets}
          holdings={holdings.filter(
            (h) => h.portfolioSource === selectedPortfolio,
          )}
          selectedPortfolio={selectedPortfolio}
        />
      </div>
    </div>
  );
};

export default Index;
