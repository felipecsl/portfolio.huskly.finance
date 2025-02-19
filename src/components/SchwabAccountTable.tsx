import { formatPrice } from "@/lib/utils/format";
import { ParsedPortfolio } from "@/types/schwab";
import { useState } from "react";
import { AssetList } from "./AssetList";
import { PercentageChange } from "./PercentageChange";

export const SchwabAccountTable = ({ account }: SchwabAccountTableProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

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

  return (
    <div className="mb-8 brutal-border bg-stone-900 rounded-lg overflow-hidden text-gray-300">
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

      {isExpanded && <AssetList assets={account.positions} />}
    </div>
  );
};

export interface SchwabAccountTableProps {
  account: ParsedPortfolio;
}

function obfuscateAccountNumber(accountNumber: string): string {
  // replace every characted except the last 4 with *
  return (
    accountNumber.slice(0, -3).replace(/./g, "*") + accountNumber.slice(-3)
  );
}
