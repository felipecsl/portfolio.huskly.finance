import { useState, useEffect } from "react";
import { Portfolio } from "@/types/crypto";

const STORAGE_KEY = "portfolios";

export function usePortfolios() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  // Save to localStorage whenever portfolios change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolios));
  }, [portfolios]);

  const addPortfolio = (portfolio: Portfolio) => {
    setPortfolios((current) => {
      // Replace if portfolio with same name exists, otherwise add
      const index = current.findIndex((p) => p.Name === portfolio.Name);
      if (index >= 0) {
        const newPortfolios = [...current];
        newPortfolios[index] = portfolio;
        return newPortfolios;
      }
      return [...current, portfolio];
    });
  };

  const removePortfolio = (name: string) => {
    setPortfolios((current) => current.filter((p) => p.Name !== name));
  };

  return {
    portfolios,
    addPortfolio,
    removePortfolio,
  };
}
