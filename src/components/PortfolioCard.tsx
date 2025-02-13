import { formatPrice } from "@/lib/utils/format";
import { AssetWithAmount } from "@/types/crypto";
import { isEmpty } from "lodash";
import { useState } from "react";
import { AssetList } from "./AssetList";
import { PercentageChange } from "./PercentageChange";

export interface PortfolioCardProps {
  name: string;
  assets: AssetWithAmount[];
  totalValue: number;
  onRemove: () => void;
}

export function PortfolioCard({
  name,
  assets,
  totalValue,
  onRemove,
}: PortfolioCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className="p-6 bg-stone-800 text-gray-200 dark:bg-stone-800 hover:bg-stone-900 dark:text-brutal-white border-gray-950 border rounded drop-shadow-lg cursor-pointer"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-medium">{name}</h2>
          <p className="text-gray-400">{assets.length} holdings</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-medium">
            {totalValue ? formatPrice(totalValue) : "Loading..."}
          </div>
          {!isEmpty(assets) && (
            <div className="mt-4">
              <PercentageChange
                value={
                  (assets!.reduce((sum, asset) => {
                    return (
                      sum +
                      (+asset.amount *
                        +asset.priceUsd *
                        +asset.changePercent24Hr) /
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

      {isExpanded && assets && <AssetList assets={assets} />}
    </div>
  );
}
