import { Portfolio } from "@/types/crypto";
import { PortfolioCard } from "./PortfolioCard"; // Your existing card component

interface PortfolioListProps {
  portfolios: Portfolio[];
  onRemove: (name: string) => void;
}

export function PortfolioList({ portfolios, onRemove }: PortfolioListProps) {
  return (
    <div className="space-y-6">
      {portfolios.map((portfolio) => (
        <PortfolioCard
          key={portfolio.Name}
          portfolio={portfolio}
          onRemove={() => onRemove(portfolio.Name)}
        />
      ))}
    </div>
  );
}
