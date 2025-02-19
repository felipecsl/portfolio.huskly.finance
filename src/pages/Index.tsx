import { PortfolioList } from "@/components/PortfolioList";
import { PortfolioUpload } from "@/components/PortfolioUpload";
import { usePortfolios } from "@/hooks/usePortfolios";
import { SchwabAccountTable } from "@/components/SchwabAccountTable";
import { Link } from "react-router-dom";

export interface StockProfile {
  name: string;
}

const Index = () => {
  const { portfolios, schwabAccounts, addPortfolio, removePortfolio } =
    usePortfolios();

  return (
    <div className="min-h-screen p-8 bg-zinc-800">
      <div className="w-full max-w-6xl mx-auto">
        <div className="mb-8 flex justify-end">
          <Link
            to="/transactions"
            className="px-4 py-2 text-white bg-stone-900 rounded-lg border border-gray-950 hover:bg-stone-800 transition-colors"
          >
            View Transactions
          </Link>
        </div>

        {schwabAccounts.map((account, i) => (
          <SchwabAccountTable
            key={`${account.accountNumber}-${i}`}
            account={account}
          />
        ))}

        {!portfolios.length ? (
          <PortfolioUpload onUpload={addPortfolio} />
        ) : (
          <>
            <PortfolioList portfolios={portfolios} onRemove={removePortfolio} />
            <div className="mt-8">
              <PortfolioUpload onUpload={addPortfolio} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Index;
