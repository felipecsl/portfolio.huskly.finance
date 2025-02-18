import { PortfolioList } from "@/components/PortfolioList";
import { PortfolioUpload } from "@/components/PortfolioUpload";
import { usePortfolios } from "@/hooks/usePortfolios";
import { SchwabPortfolioList } from "@/components/SchwabPortfolioList";

export interface StockProfile {
  name: string;
}

const Index = () => {
  const { portfolios, schwabPortfolio, addPortfolio, removePortfolio } =
    usePortfolios();

  return (
    <div className="min-h-screen p-8 bg-zinc-800">
      <div className="w-full max-w-6xl mx-auto">
        {schwabPortfolio && <SchwabPortfolioList portfolio={schwabPortfolio} />}

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
