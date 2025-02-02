import { Asset } from "@/types/crypto";
import { formatMarketCap, formatPrice, formatPercentage } from "@/lib/utils/format";
import { useNavigate } from "react-router-dom";

interface AssetListProps {
  assets: Asset[];
}

export const AssetList = ({ assets }: AssetListProps) => {
  const navigate = useNavigate();

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="grid grid-cols-5 gap-4 px-4 py-2 bg-brutal-black text-brutal-white font-bold">
        <div>Rank</div>
        <div>Name</div>
        <div>Price</div>
        <div>24h Change</div>
        <div>Market Cap</div>
      </div>
      <div className="space-y-4 mt-4">
        {assets.map((asset) => (
          <div
            key={asset.id}
            onClick={() => navigate(`/asset/${asset.id}`)}
            className="grid grid-cols-5 gap-4 p-4 brutal-border bg-brutal-white cursor-pointer"
          >
            <div className="font-bold">{asset.rank}</div>
            <div className="font-bold">
              {asset.name}
              <span className="ml-2 text-sm text-gray-600">{asset.symbol}</span>
            </div>
            <div>{formatPrice(asset.priceUsd)}</div>
            <div className={parseFloat(asset.changePercent24Hr) >= 0 ? "text-green-600" : "text-red-600"}>
              {formatPercentage(asset.changePercent24Hr)}
            </div>
            <div>{formatMarketCap(asset.marketCapUsd)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};