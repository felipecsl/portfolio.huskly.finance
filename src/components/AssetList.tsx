import { Asset, UserHolding } from "@/types/crypto";
import { formatPrice, formatPercentage } from "@/lib/utils/format";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { PercentageChange } from "./PercentageChange";

type SortField =
  | "symbol"
  | "name"
  | "priceUsd"
  | "amount"
  | "value"
  | "changePercent24Hr";
type SortDirection = "asc" | "desc";

interface AssetListProps {
  assets: Asset[];
  holdings: UserHolding[];
  selectedPortfolio:
    | "fidelity401k"
    | "julipeschwab"
    | "personalschwab"
    | "iraschwab"
    | "crypto"
    | "ibkr";
}

export const AssetList = ({
  assets,
  holdings,
  selectedPortfolio,
}: AssetListProps) => {
  const navigate = useNavigate();
  // Load saved preferences from localStorage
  const savedSortField = localStorage.getItem("sortField") || "symbol";
  const savedSortDirection = localStorage.getItem("sortDirection") || "asc";

  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>(
    savedSortField as SortField,
  );
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    savedSortDirection as SortDirection,
  );

  const calculateHoldingValue = (asset: Asset) => {
    const holding = holdings.find((h) => h.symbol === asset.symbol);
    return holding ? parseFloat(asset.priceUsd) * holding.amount : 0;
  };

  const getHoldingAmount = (symbol: string) => {
    const holding = holdings.find((h) => h.symbol === symbol);
    return holding ? Number(holding.amount.toFixed(3)) : 0;
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // If clicking the same field, toggle direction
      const newDirection = sortDirection === "asc" ? "desc" : "asc";
      setSortDirection(newDirection);
      localStorage.setItem("sortDirection", newDirection);
    } else {
      // If clicking a new field, set it with default asc direction
      setSortField(field);
      setSortDirection("asc");
      localStorage.setItem("sortField", field);
      localStorage.setItem("sortDirection", "asc");
    }
  };

  const getSortedAssets = () => {
    return [...assets]
      .filter((asset) =>
        asset.symbol.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      .sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case "symbol":
            comparison = a.symbol.localeCompare(b.symbol);
            break;
          case "name":
            comparison = a.name.localeCompare(b.name);
            break;
          case "priceUsd":
            comparison = parseFloat(a.priceUsd) - parseFloat(b.priceUsd);
            break;
          case "amount":
            comparison =
              getHoldingAmount(a.symbol) - getHoldingAmount(b.symbol);
            break;
          case "value":
            comparison = calculateHoldingValue(a) - calculateHoldingValue(b);
            break;
          case "changePercent24Hr":
            comparison =
              parseFloat(a.changePercent24Hr) - parseFloat(b.changePercent24Hr);
            break;
        }
        return sortDirection === "asc" ? comparison : -comparison;
      });
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>;
  };

  const renderHeaderCell = (field: SortField, label: string) => (
    <th
      className="p-2 text-left cursor-pointer hover:bg-gray-500 text-right"
      onClick={() => handleSort(field)}
    >
      {label}
      <SortIcon field={field} />
    </th>
  );

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex flex-col gap-4 mb-4">
        <input
          type="text"
          placeholder="Search by symbol..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="brutal-border px-4 py-3 w-full bg-gray-600 text-brutal-black dark:bg-gray-300 dark:text-brutal-white text-lg rounded drop-shadow-lg"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border drop-shadow-lg rounded-lg border-gray-950">
          <thead>
            <tr className="border-b border-brutal-black dark:border-brutal-white p-2 rounded-t-lg">
              {renderHeaderCell("symbol", "Symbol")}
              {renderHeaderCell("name", "Name")}
              {renderHeaderCell("priceUsd", "Price")}
              {renderHeaderCell("amount", "Amount")}
              {renderHeaderCell("value", "Value")}
              {renderHeaderCell("changePercent24Hr", "24h Change")}
            </tr>
          </thead>
          <tbody>
            {getSortedAssets().map((asset) => {
              const value = calculateHoldingValue(asset);
              return (
                <tr
                  key={`${selectedPortfolio}-${asset.id}`}
                  className="p-2 text-sm hover:bg-stone-700 cursor-pointer bg-stone-800 border-b border-gray-950"
                  onClick={() => navigate(`/asset/${asset.symbol}`)}
                >
                  <td className="p-4">{asset.symbol}</td>
                  <td className="px-2 py-4">{asset.name}</td>
                  <td className="px-2 py-4 text-right">
                    {formatPrice(parseFloat(asset.priceUsd))}
                  </td>
                  <td className="px-2 py-4 text-right">
                    {getHoldingAmount(asset.symbol).toLocaleString()}
                  </td>
                  <td className="px-2 py-4 text-right">{formatPrice(value)}</td>
                  <td className="p-4 text-right">
                    <PercentageChange
                      value={parseFloat(asset.changePercent24Hr)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
