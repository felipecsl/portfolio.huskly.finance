export interface SchwabPosition {
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

export interface SchwabAccount {
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

export interface SchwabQuoteResponse {
  [symbol: string]: {
    assetMainType: string;
    assetSubType: string;
    quoteType: string;
    realtime: boolean;
    ssid: number;
    symbol: string;
    quote: {
      lastPrice: number;
      netPercentChange: number;
      markPercentChange: number;
      // ... other quote fields
    };
    reference: {
      description: string;
      // ... other reference fields
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
  type: "stock" | "option";
}

export interface ParsedPortfolio {
  accountNumber: string;
  positions: ParsedPosition[];
  liquidationValue: number;
  availableFunds: number;
  buyingPower: number;
  cashBalance: number;
}

export interface PriceHistoryParams {
  symbol: string;
  periodType?: "day" | "month" | "year" | "ytd";
  period?: number;
  frequencyType?: "minute" | "daily" | "weekly" | "monthly";
  frequency?: number;
  startDate?: number;
  endDate?: number;
  needExtendedHoursData?: boolean;
}

export interface PriceHistoryResponse {
  candles: Array<{
    datetime: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
  symbol: string;
  empty: boolean;
}

export interface PriceDataPoint {
  timestamp: number;
  price: number;
}
