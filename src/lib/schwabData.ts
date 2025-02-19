import { Trade } from "@/types/trades";
import { cacheFetch } from "./cache";
import { startOfYear, format } from "date-fns";

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
  accountNumber: string;
  positions: ParsedPosition[];
  liquidationValue: number;
  availableFunds: number;
  buyingPower: number;
  cashBalance: number;
}

export function parseSchwabAccounts(data: SchwabAccount[]): ParsedPortfolio[] {
  if (!data || !data.length) {
    return [];
  }

  return data.map((account) => {
    const positions = account.securitiesAccount.positions || [];

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
      accountNumber: account.securitiesAccount.accountNumber,
      positions: parsedPositions,
      liquidationValue:
        account.securitiesAccount.currentBalances.liquidationValue,
      availableFunds: account.securitiesAccount.currentBalances.availableFunds,
      buyingPower: account.securitiesAccount.currentBalances.buyingPower,
      cashBalance: account.securitiesAccount.currentBalances.cashBalance,
    };
  });
}

// Helper function to format currency values
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export async function fetchSchwabAccounts(): Promise<ParsedPortfolio[]> {
  return (
    (await cacheFetch<ParsedPortfolio[]>(
      "schwab-accounts",
      async () => {
        try {
          const token = await getSchwabToken();
          const response = await fetch(
            "https://api.schwabapi.com/trader/v1/accounts?fields=positions",
            { headers: { Authorization: `Bearer ${token}` } },
          );
          const data = await response.json();
          return parseSchwabAccounts(data);
        } catch (error) {
          console.error("Error fetching Schwab data:", error);
          throw error;
        }
      },
      60, // 1 minute
    )) || []
  );
}

export async function getSchwabToken(): Promise<string | null> {
  return await cacheFetch<string>(
    "schwab-token",
    async () => {
      if (import.meta.env.PROD) {
        const response = await fetch(
          "https://huskly.finance/schwab/oauth/token",
          { method: "GET", credentials: "include" },
        );
        if (!response.ok) {
          throw new Error("Failed to fetch Schwab token");
        }
        const { token } = await response.json();
        return token;
      } else {
        // allow overriding oauth token for local development
        return import.meta.env.VITE_SCHWAB_TOKEN;
      }
    },
    900, // 15 minutes
  );
}

export async function fetchAccountNumbers(): Promise<
  { accountNumber: string; hashValue: string }[]
> {
  return (
    (await cacheFetch<{ accountNumber: string; hashValue: string }[]>(
      "schwab-account-numbers",
      async () => {
        try {
          const token = await getSchwabToken();
          const response = await fetch(
            "https://api.schwabapi.com/trader/v1/accounts/accountNumbers",
            { headers: { Authorization: `Bearer ${token}` } },
          );
          if (!response.ok) {
            throw new Error(
              `Failed to fetch account numbers: ${response.statusText}`,
            );
          }
          return await response.json();
        } catch (error) {
          console.error("Error fetching account numbers:", error);
          throw error;
        }
      },
      60 * 60 * 12, // 12 hours cache duration
    )) || []
  );
}

export async function fetchTransactionHistory(
  startDate: Date = startOfYear(new Date()),
  endDate: Date = new Date(),
): Promise<{ accountNumber: string; transactions: Trade[] }[]> {
  const accountNumbers = await fetchAccountNumbers();
  const transactionHistory = await Promise.all(
    accountNumbers.map((account) =>
      fetchAccountTransactionHistory(account.hashValue, startDate, endDate),
    ),
  );
  return transactionHistory.map((transactions, index) => ({
    accountNumber: accountNumbers[index].accountNumber,
    transactions,
  }));
}

export async function fetchAccountTransactionHistory(
  accountHash: string,
  startDate: Date = startOfYear(new Date()),
  endDate: Date = new Date(),
): Promise<Trade[]> {
  try {
    const token = await getSchwabToken();

    // Format dates to ISO string with milliseconds
    const formattedStartDate = format(
      startDate,
      "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
    );
    const formattedEndDate = format(endDate, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");

    const response = await fetch(
      `https://api.schwabapi.com/trader/v1/accounts/${accountHash}/transactions?startDate=${formattedStartDate}&endDate=${formattedEndDate}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch account transactions: ${response.statusText}`,
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching transaction history:", error);
    throw error;
  }
}
