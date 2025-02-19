import { ParsedPortfolio } from "@/lib/schwabData";
import { formatPrice } from "@/lib/utils/format";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PercentageChange } from "./PercentageChange";

export const SchwabAccountTable = ({ account }: SchwabAccountTableProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();

  const totalValue = account.positions.reduce(
    (sum, position) => sum + position.value,
    0,
  );

  const totalDayChange =
    (account.positions.reduce(
      (sum, position) =>
        sum + (position.value * parseFloat(position.changePercent24Hr)) / 100,
      0,
    ) /
      totalValue) *
    100;

  function obfuscateAccountNumber(accountNumber: string): string {
    // replace every characted except the last 4 with *
    return (
      accountNumber.slice(0, -3).replace(/./g, "*") + accountNumber.slice(-3)
    );
  }

  return (
    <div className="mb-8 brutal-border bg-stone-900 rounded-lg overflow-hidden">
      <div
        className="p-6 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-medium text-white">
              Account {obfuscateAccountNumber(account.accountNumber)}
            </h2>
            <p className="text-gray-400">{account.positions.length} holdings</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-medium text-white">
              {formatPrice(account.liquidationValue)}
            </div>
            {account.positions.length > 0 && (
              <div className="mt-4">
                <PercentageChange value={totalDayChange} />
              </div>
            )}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-t border-b border-gray-800">
                <th className="p-4 text-gray-400">Symbol</th>
                <th className="px-2 py-4 text-gray-400">Name</th>
                <th className="px-2 py-4 text-gray-400 text-right">Price</th>
                <th className="px-2 py-4 text-gray-400 text-right">Amount</th>
                <th className="px-2 py-4 text-gray-400 text-right">Value</th>
                <th className="p-4 text-gray-400 text-right">24h Change</th>
              </tr>
            </thead>
            <tbody>
              {account.positions.map((position, i) => (
                <tr
                  key={`${position.symbol}-${i}`}
                  className="border-b border-gray-800 hover:bg-stone-800 cursor-pointer"
                  onClick={() => navigate(`/asset/${position.symbol}`)}
                >
                  <td className="p-4 text-gray-300">{position.symbol}</td>
                  <td className="px-2 py-4 text-gray-300">{position.name}</td>
                  <td className="px-2 py-4 text-gray-300 text-right">
                    {formatPrice(parseFloat(position.priceUsd))}
                  </td>
                  <td className="px-2 py-4 text-gray-300 text-right">
                    {position.amount.toLocaleString()}
                  </td>
                  <td className="px-2 py-4 text-gray-300 text-right">
                    {formatPrice(position.value)}
                  </td>
                  <td className="p-4 text-right">
                    <PercentageChange
                      value={parseFloat(position.changePercent24Hr)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export interface SchwabAccountTableProps {
  account: ParsedPortfolio;
}
