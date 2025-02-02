import { Asset, UserHolding } from "@/types/crypto";
import { formatPrice, formatPercentage } from "@/lib/utils/format";
import { useNavigate } from "react-router-dom";

interface AssetListProps {
  assets: Asset[];
  holdings: UserHolding[];
}

export const AssetList = ({ assets, holdings }: AssetListProps) => {
  const navigate = useNavigate();

  const calculateHoldingValue = (asset: Asset) => {
    const holding = holdings.find(h => h.symbol === asset.symbol);
    if (!holding) return 0;
    return parseFloat(asset.priceUsd) * holding.amount;
  };

  const getHoldingAmount = (symbol: string) => {
    const holding = holdings.find(h => h.symbol === symbol);
    return holding ? holding.amount : 0;
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="grid grid-cols-5 gap-4 px-4 py-2 bg-brutal-black text-brutal-white font-bold dark:bg-brutal-white dark:text-brutal-black">
        <div>Rank</div>
        <div>Name</div>
        <div>Price</div>
        <div>24h Change</div>
        <div>Holdings Value</div>
      </div>
      <div className="space-y-4 mt-4">
        {assets.map((asset) => (
          <div
            key={asset.id}
            onClick={() => navigate(`/asset/${asset.id}`)}
            className="grid grid-cols-5 gap-4 p-4 brutal-border bg-brutal-white cursor-pointer dark:bg-brutal-black dark:text-brutal-white"
          >
            <div className="font-bold">{asset.rank}</div>
            <div className="font-bold">
              {asset.name}
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                {asset.symbol}
                {getHoldingAmount(asset.symbol) > 0 && ` (${getHoldingAmount(asset.symbol)})`}
              </span>
            </div>
            <div>{formatPrice(asset.priceUsd)}</div>
            <div className={parseFloat(asset.changePercent24Hr) >= 0 ? "text-green-600" : "text-red-600"}>
              {formatPercentage(asset.changePercent24Hr)}
            </div>
            <div>{formatPrice(calculateHoldingValue(asset))}</div>
          </div>
        ))}
      </div>
    </div>
  );
};