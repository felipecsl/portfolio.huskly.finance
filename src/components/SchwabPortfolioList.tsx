import { formatCurrency, ParsedPortfolio } from "@/lib/schwabData";
import { AssetList } from "./AssetList";

export const SchwabPortfolioList = ({
  portfolio,
}: SchwabPortfolioListProps) => {
  return (
    <div className="p-6 bg-stone-800 text-gray-200 dark:bg-stone-800 hover:bg-stone-900 dark:text-brutal-white border-gray-950 border rounded drop-shadow-lg cursor-pointer mb-6">
      <div className="mb-6">
        <h2 className="text-xl font-medium mb-2">Portfolio Summary</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-muted-foreground">Net Liq</div>
            <div className="text-lg font-medium">
              {formatCurrency(portfolio.liquidationValue)}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Available Funds</div>
            <div className="text-lg font-medium">
              {formatCurrency(portfolio.availableFunds)}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Cash Balance</div>
            <div className="text-lg font-medium">
              {formatCurrency(portfolio.cashBalance)}
            </div>
          </div>
        </div>
      </div>

      <AssetList assets={portfolio.positions} />
    </div>
  );
};
export interface SchwabPortfolioListProps {
  portfolio: ParsedPortfolio;
}
