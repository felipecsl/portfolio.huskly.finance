interface SchwabPosition {
  shortQuantity: number;
  longQuantity: number;
  averagePrice: number;
  currentDayProfitLoss: number;
  currentDayProfitLossPercentage: number;
  instrument: {
    assetType: string;
    cusip: string;
    symbol: string;
    description: string;
    instrumentId: number;
    netChange: number;
    type: string;
  };
  marketValue: number;
}

interface SchwabAccount {
  securitiesAccount: {
    accountNumber: string;
    positions: SchwabPosition[];
    currentBalances: {
      equity: number;
      availableFunds: number;
      buyingPower: number;
      cashBalance: number;
      liquidationValue: number;
    };
  };
}

export interface ParsedPosition {
  symbol: string;
  name: string;
  amount: number;
  priceUsd: string;
  value: number;
  changePercent24Hr: string;
  id: string;
  type: "stock";
}

export interface ParsedPortfolio {
  positions: ParsedPosition[];
  liquidationValue: number;
  availableFunds: number;
  buyingPower: number;
  cashBalance: number;
}

export function parseSchwabData(data: SchwabAccount[]): ParsedPortfolio {
  if (!data || !data.length) {
    return {
      positions: [],
      liquidationValue: 0,
      availableFunds: 0,
      buyingPower: 0,
      cashBalance: 0,
    };
  }

  const account = data[0].securitiesAccount;
  const positions = account.positions || [];

  const parsedPositions: ParsedPosition[] = positions
    .filter((pos) => pos.longQuantity > 0 || pos.shortQuantity > 0) // Filter out zero-quantity positions
    .map((position) => {
      const quantity = position.longQuantity - position.shortQuantity;

      return {
        symbol:
          position.instrument.assetType === "EQUITY"
            ? position.instrument.symbol
            : position.instrument.symbol.split(" ")[0],
        name: position.instrument.description || position.instrument.symbol,
        amount: quantity,
        priceUsd: position.averagePrice.toFixed(2),
        value: position.marketValue,
        changePercent24Hr: position.currentDayProfitLossPercentage.toFixed(2),
        id: position.instrument.cusip,
        type: "stock" as const,
      };
    });

  return {
    positions: parsedPositions,
    liquidationValue: account.currentBalances.liquidationValue,
    availableFunds: account.currentBalances.availableFunds,
    buyingPower: account.currentBalances.buyingPower,
    cashBalance: account.currentBalances.cashBalance,
  };
}

// Helper function to format currency values
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export async function fetchSchwabData(): Promise<ParsedPortfolio> {
  try {
    const token = import.meta.env.VITE_SCHWAB_TOKEN;
    const response = await fetch(
      "https://api.schwabapi.com/trader/v1/accounts?fields=positions",
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const data = await response.json();
    return parseSchwabData(data);
  } catch (error) {
    console.error("Error fetching Schwab data:", error);
    throw error;
  }
}
