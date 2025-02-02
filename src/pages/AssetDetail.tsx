import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Asset, AssetHistory } from "@/types/crypto";
import { PriceChart } from "@/components/PriceChart";
import { formatPrice, formatMarketCap, formatPercentage } from "@/lib/utils/format";

const AssetDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: asset } = useQuery({
    queryKey: ["asset", id],
    queryFn: async () => {
      const response = await fetch(`https://api.coincap.io/v2/assets/${id}`);
      const data = await response.json();
      return data.data as Asset;
    },
    refetchInterval: 30000,
  });

  const { data: history } = useQuery({
    queryKey: ["assetHistory", id],
    queryFn: async () => {
      const response = await fetch(
        `https://api.coincap.io/v2/assets/${id}/history?interval=d1`
      );
      const data = await response.json();
      return data.data as AssetHistory[];
    },
  });

  if (!asset || !history) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="brutal-border bg-brutal-white p-4">
          Loading asset...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <button onClick={() => navigate("/")} className="brutal-btn mb-8">
        ← Back to Assets
      </button>
      
      <div className="max-w-4xl mx-auto">
        <div className="brutal-border bg-brutal-white p-6 mb-8">
          <h1 className="text-4xl font-bold mb-4">
            {asset.name}
            <span className="ml-2 text-xl text-gray-600">{asset.symbol}</span>
          </h1>
          
          <div className="grid grid-cols-2 gap-8 mb-6">
            <div>
              <p className="text-sm mb-1">Price</p>
              <p className="text-2xl font-bold">{formatPrice(asset.priceUsd)}</p>
            </div>
            <div>
              <p className="text-sm mb-1">24h Change</p>
              <p className={`text-2xl font-bold ${parseFloat(asset.changePercent24Hr) >= 0 ? "text-green-600" : "text-red-600"}`}>
                {formatPercentage(asset.changePercent24Hr)}
              </p>
            </div>
            <div>
              <p className="text-sm mb-1">Market Cap</p>
              <p className="text-2xl font-bold">{formatMarketCap(asset.marketCapUsd)}</p>
            </div>
            <div>
              <p className="text-sm mb-1">24h Volume</p>
              <p className="text-2xl font-bold">{formatMarketCap(asset.volumeUsd24Hr)}</p>
            </div>
          </div>
        </div>

        <PriceChart data={history} />
      </div>
    </div>
  );
};

export default AssetDetail;