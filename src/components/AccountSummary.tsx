import { ParsedPortfolio } from "@/types/schwab";
import { formatPrice } from "@/lib/utils/format";

interface AccountSummaryProps {
  account: ParsedPortfolio;
}

const MetricCard = ({ label, value }: { label: string; value: string }) => (
  <div className="p-4 brutal-border bg-stone-900 rounded-lg">
    <div className="text-gray-400 text-sm mb-1">{label}</div>
    <div className="text-xl font-medium text-white">{value}</div>
  </div>
);

export const AccountSummary = ({ account }: AccountSummaryProps) => {
  return (
    <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
      <MetricCard
        label="Net Liquidation Value"
        value={formatPrice(account.liquidationValue)}
      />
      <MetricCard
        label="Cash Balance"
        value={formatPrice(account.cashBalance)}
      />
      <MetricCard
        label="Available Funds"
        value={formatPrice(account.availableFunds)}
      />
      <MetricCard
        label="Buying Power"
        value={formatPrice(account.buyingPower)}
      />
    </div>
  );
};
