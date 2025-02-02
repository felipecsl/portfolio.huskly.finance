import { useQuery } from "@tanstack/react-query";
import { Asset, UserHolding } from "@/types/crypto";
import { AssetList } from "@/components/AssetList";
import { formatPrice } from "@/lib/utils/format";

// Sample holdings data
const sampleHoldings: UserHolding[] = [
  { symbol: "BTC", amount: 0.5 },
  { symbol: "ETH", amount: 4 },
  { symbol: "SOL", amount: 25 },
];

const Index = () => {
  const { data: assets, isLoading, error } = useQuery({
    queryKey: ["assets"],
    queryFn: async () => {
      const response = await fetch("https://api.coincap.io/v2/assets");
      const data = await response.json();
      return data.data as Asset[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const calculateTotalValue = () => {
    if (!assets) return 0;
    return sampleHoldings.reduce((total, holding) => {
      const asset = assets.find(a => a.symbol === holding.symbol);
      if (asset) {
        return total + (parseFloat(asset.priceUsd) * holding.amount);
      }
      return total;
    }, 0);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="brutal-border bg-brutal-white p-4">
          Loading assets...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="brutal-border bg-brutal-white p-4 text-red-600">
          Error loading assets
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-4 text-center">Crypto Assets</h1>
      <div className="text-2xl font-bold mb-8 text-center brutal-border inline-block px-6 py-3 mx-auto">
        Total Portfolio Value: {formatPrice(calculateTotalValue())}
      </div>
      <AssetList assets={assets} holdings={sampleHoldings} />
    </div>
  );
};

export default Index;