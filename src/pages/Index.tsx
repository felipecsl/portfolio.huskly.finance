import { PortfolioList } from "@/components/PortfolioList";
import { PortfolioUpload } from "@/components/PortfolioUpload";
import { SchwabAccountTable } from "@/components/SchwabAccountTable";
import { usePortfolios } from "@/hooks/usePortfolios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";

export interface StockProfile {
  name: string;
}

const Index = () => {
  const { portfolios, schwabAccounts, addPortfolio, removePortfolio } =
    usePortfolios();

  const [portfolioValues, setPortfolioValues] = useState<
    Record<string, number>
  >({});

  const sortedSchwabAccounts = [...schwabAccounts].sort(
    (a, b) => b.liquidationValue - a.liquidationValue,
  );

  const handleValueUpdate = useCallback(
    (portfolioName: string, value: number) => {
      setPortfolioValues((prev) => {
        // Only update if the value has changed
        if (prev[portfolioName] === value) {
          return prev;
        }
        return {
          ...prev,
          [portfolioName]: value,
        };
      });
    },
    [],
  );

  const totalPortfoliosValue = useMemo(() => {
    return (
      Object.values(portfolioValues).reduce((sum, value) => sum + value, 0) +
      schwabAccounts.reduce((sum, account) => sum + account.liquidationValue, 0)
    );
  }, [portfolioValues, schwabAccounts]);

  return (
    <div className="min-h-screen p-8 bg-zinc-800">
      <div className="w-full max-w-4xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <Logo />
          <Link
            to="/transactions"
            className="px-4 py-2 text-white bg-stone-900 rounded-lg border border-gray-950 hover:bg-stone-800 transition-colors"
          >
            View Transactions
          </Link>
        </div>

        <div className="bg-white shadow rounded-lg px-4 py-6 dark:bg-stone-900 border-gray-950 border rounded drop-shadow-lg mb-8">
          <h2 className="text-4xl font-medoium text-gray-900 dark:text-white">
            $
            {totalPortfoliosValue.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </h2>
        </div>

        {sortedSchwabAccounts.map((account, i) => (
          <Link
            key={`${account.accountNumber}-${i}`}
            to={`/account/${account.accountNumber}`}
            className="block mb-4 hover:opacity-90 transition-opacity"
          >
            <SchwabAccountTable account={account} isExpanded={false} />
          </Link>
        ))}

        <PortfolioList
          portfolios={portfolios}
          onRemove={removePortfolio}
          onValueUpdate={handleValueUpdate}
        />
        <div className="mt-8">
          <PortfolioUpload onUpload={addPortfolio} />
        </div>
      </div>
    </div>
  );
};

export default Index;
