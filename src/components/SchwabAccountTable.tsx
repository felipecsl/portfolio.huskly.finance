import { formatCurrency, ParsedPortfolio } from "@/lib/schwabData";
import { AssetList } from "./AssetList";

export const SchwabAccountTable = ({ account }: SchwabAccountTableProps) => {
  function obfuscateAccountNumber(accountNumber: string): string {
    // replace every characted except the last 4 with *
    return (
      accountNumber.slice(0, -3).replace(/./g, "*") + accountNumber.slice(-3)
    );
  }

  return (
    <div className="p-6 bg-stone-800 text-gray-200 bg-stone-900 dark:text-brutal-white border-gray-950 border rounded drop-shadow-lg cursor-pointer mb-6">
      <div className="mb-6">
        <h2 className="text-xl font-medium mb-2">
          Portfolio Summary{" "}
          <pre className="text-gray-400 text-sm">
            {obfuscateAccountNumber(account.accountNumber)}
          </pre>
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-muted-foreground">Net Liq</div>
            <div className="text-lg font-medium">
              {formatCurrency(account.liquidationValue)}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Available Funds</div>
            <div className="text-lg font-medium">
              {formatCurrency(account.availableFunds)}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Cash Balance</div>
            <div className="text-lg font-medium">
              {formatCurrency(account.cashBalance)}
            </div>
          </div>
        </div>
      </div>

      <AssetList assets={account.positions} />
    </div>
  );
};
export interface SchwabAccountTableProps {
  account: ParsedPortfolio;
}
