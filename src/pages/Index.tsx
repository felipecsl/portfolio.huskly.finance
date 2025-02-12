import { PortfolioList } from "@/components/PortfolioList";
import { PortfolioUpload } from "@/components/PortfolioUpload";
import { usePortfolios } from "@/hooks/usePortfolios";

export interface StockProfile {
  name: string;
}

const Index = () => {
  const { portfolios, addPortfolio, removePortfolio } = usePortfolios();

  return (
    <div className="min-h-screen p-8 bg-zinc-800">
      <div className="w-full max-w-4xl mx-auto">
        {!portfolios.length ? (
          <PortfolioUpload onUpload={addPortfolio} />
        ) : (
          <>
            <div className="mb-8">
              <PortfolioUpload onUpload={addPortfolio} />
            </div>
            <PortfolioList portfolios={portfolios} onRemove={removePortfolio} />
          </>
        )}
      </div>
    </div>
  );
};

export default Index;
