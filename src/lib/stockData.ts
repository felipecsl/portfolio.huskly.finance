import { Asset, UserHolding } from "@/types/crypto";
import { getFromCache, setCache } from "./cache";
import { subBusinessDays } from "date-fns";
import { getTimezoneOffset } from "date-fns-tz";

export interface StockProfile {
  name: string;
}

export interface StockQuote {
  c: number;
  dp: number;
  name: string;
}

async function fetchYahooQuote(symbol: string): Promise<StockQuote> {
  const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(
    yahooUrl,
  )}`;

  const response = await fetch(proxyUrl);
  const data = await response.json();

  if (data.contents) {
    const yahooData = JSON.parse(data.contents);
    if (yahooData.chart?.result?.[0]) {
      const result = yahooData.chart.result[0];
      const price =
        result.meta.regularMarketPrice || result.meta.chartPreviousClose || 0;
      const prevClose = result.meta.chartPreviousClose || price;

      return {
        c: price,
        dp: prevClose ? ((price - prevClose) / prevClose) * 100 : 0,
        name:
          result.meta.regularMarketName ||
          result.meta.chartPreviousCloseName ||
          "",
      };
    }
  }
  console.error(`Failed to get quote for ${symbol}`);
  return { c: 0, dp: 0, name: "" };
}

interface SchwabQuote {
  symbol: string;
  description: string;
  bidPrice: number;
  askPrice: number;
  lastPrice: number;
  previousClose: number;
  volume: number;
  changeAmount: number;
  changePercent: number;
  exchange: string;
  tradeTime: string;
}

interface SchwabQuoteResponse {
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

function capitalizeCompanyName(name: string): string {
  // Split on spaces and handle each word
  return name
    .split(" ")
    .map((word) => {
      // Keep acronyms in caps, capitalize first letter of other words
      return word.match(/^[A-Z]+$/)
        ? word
        : word.charAt(0).toUpperCase() + word.toLowerCase().slice(1);
    })
    .join(" ");
}

async function getSchwabToken(): Promise<string> {
  // Try to get from cache first
  const cachedToken = getFromCache<string>("schwab-token");
  if (cachedToken) {
    return cachedToken;
  }

  // Fetch new token
  const response = await fetch("https://huskly.finance/schwab/oauth/token", {
    method: "GET",
    credentials: "include", // This ensures cookies are sent
  });
  if (!response.ok) {
    throw new Error("Failed to fetch Schwab token");
  }

  const { token } = await response.json();

  // Cache token for 15 minutes (900 seconds)
  return setCache("schwab-token", token, 900);
}

export async function fetchStockQuotes(
  symbols: string[],
): Promise<Map<string, StockQuote>> {
  const quotes = new Map<string, StockQuote>();
  const symbolsToFetch: string[] = [];

  // First check cache for each symbol
  for (const symbol of symbols) {
    const quoteCacheKey = `stock-quote-${symbol}`;
    const cachedQuote = getFromCache<StockQuote>(quoteCacheKey);
    if (cachedQuote) {
      quotes.set(symbol, cachedQuote);
    } else {
      symbolsToFetch.push(symbol);
    }
  }

  // If we have symbols that need fetching
  if (symbolsToFetch.length > 0) {
    try {
      const token = await getSchwabToken();
      const response = await fetch(
        `https://api.schwabapi.com/marketdata/v1/quotes?symbols=${symbolsToFetch.join(
          ",",
        )}&fields=quote%2Creference&indicative=false`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch quotes for ${symbolsToFetch.join(", ")}`,
        );
      }

      const data: SchwabQuoteResponse = await response.json();

      // Process each quote from the response
      for (const symbol of symbolsToFetch) {
        const quoteData = data[symbol];
        if (quoteData) {
          const quote: StockQuote = {
            c: quoteData.quote.lastPrice,
            dp:
              quoteData.quote.markPercentChange ||
              quoteData.quote.netPercentChange,
            name: capitalizeCompanyName(quoteData.reference.description),
          };

          // Cache the quote
          const quoteCacheKey = `stock-quote-${symbol}`;
          setCache(quoteCacheKey, quote);

          quotes.set(symbol, quote);
        } else {
          // If symbol not found in response, try Yahoo fallback for mutual funds
          if (symbol.endsWith("X")) {
            const yahooQuote = await fetchYahooQuote(symbol);
            quotes.set(symbol, yahooQuote);
          } else {
            console.error(`No quote data found for ${symbol}`);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching quotes:", error);
      // Try Yahoo fallback for any mutual funds in the failed batch
      for (const symbol of symbolsToFetch) {
        if (symbol.endsWith("X")) {
          const yahooQuote = await fetchYahooQuote(symbol);
          quotes.set(symbol, yahooQuote);
        }
      }
      throw error;
    }
  }

  return quotes;
}

export async function fetchStockAssets(
  stocks: UserHolding[],
): Promise<Asset[]> {
  // Deduplicate stocks by symbol
  const uniqueStocks = Array.from(
    new Map(stocks.map((stock) => [stock.symbol, stock])).values(),
  );

  // Fetch all quotes at once
  const symbols = uniqueStocks.map((stock) => stock.symbol);
  const quotes = await fetchStockQuotes(symbols);

  // Map to assets
  return uniqueStocks.map(({ symbol, name }) => {
    const quote = quotes.get(symbol) || { c: 0, dp: 0, name: "" };
    return {
      id: symbol,
      symbol,
      name,
      priceUsd: quote.c.toString(),
      rank: "0",
      type: "stock",
      supply: "0",
      maxSupply: "0",
      marketCapUsd: "0",
      volumeUsd24Hr: "0",
      changePercent24Hr: quote.dp.toString(),
      vwap24Hr: "0",
    };
  });
}

export interface PriceDataPoint {
  timestamp: number;
  price: number;
}

interface FetchPriceHistoryOptions {
  symbol: string;
  isCrypto: boolean;
  cryptoId?: string;
  days?: number;
  frequency?: number;
  frequencyType?: "minute" | "daily" | "weekly" | "monthly";
}

interface PriceHistoryParams {
  symbol: string;
  periodType?: "day" | "month" | "year" | "ytd";
  period?: number;
  frequencyType?: "minute" | "daily" | "weekly" | "monthly";
  frequency?: number;
  startDate?: number;
  endDate?: number;
  needExtendedHoursData?: boolean;
}

interface PriceHistoryResponse {
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

async function fetchCryptoPriceHistory(
  cryptoId: string,
  days: number,
): Promise<PriceDataPoint[]> {
  const interval =
    days <= 1 ? "m5" : days <= 7 ? "h1" : days <= 365 ? "h12" : "d1";
  const end = Date.now();
  const start = end - days * 24 * 60 * 60 * 1000;
  const response = await fetch(
    `https://api.coincap.io/v2/assets/${cryptoId}/history?interval=${interval}&start=${start}&end=${end}`,
  );

  if (!response.ok) {
    throw new Error("Failed to fetch crypto history");
  }

  const data = await response.json();
  return data.data
    .map((item: any) => ({
      timestamp: new Date(item.time).getTime(),
      price: parseFloat(item.priceUsd),
    }))
    .sort((a, b) => a.timestamp - b.timestamp);
}

async function fetchStockPriceHistory(
  symbol: string,
  days: number,
  frequency: number,
  frequencyType: "minute" | "daily" | "weekly" | "monthly",
): Promise<PriceDataPoint[]> {
  const periodType =
    days <= 1
      ? "day"
      : days <= 10
        ? "day"
        : days <= 180
          ? "month"
          : days <= 365
            ? "year"
            : "year";
  const period =
    days <= 1
      ? 1
      : days <= 10
        ? days
        : days <= 180
          ? Math.ceil(days / 30)
          : days <= 365
            ? 1
            : 5;
  const endDate = Date.now();
  const params: PriceHistoryParams = {
    symbol,
    periodType,
    period,
    frequencyType,
    frequency,
    endDate,
    needExtendedHoursData: days <= 1,
  };

  const queryString = Object.entries(params)
    .filter(([_, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&");

  const token = await getSchwabToken();
  const response = await fetch(
    `https://api.schwabapi.com/marketdata/v1/pricehistory?${queryString}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch stock history");
  }

  const data: PriceHistoryResponse = await response.json();

  if (data.empty) {
    return [];
  }

  return (
    data.candles
      .map(({ datetime, close }) => ({ timestamp: datetime, price: close }))
      .sort((a, b) => a.timestamp - b.timestamp)
      // Filter out duplicates, keeping first occurrence if any
      .filter(
        (candle, index, array) =>
          array.findIndex((c) => c.timestamp === candle.timestamp) === index,
      )
  );
}

export async function fetchPriceHistory({
  symbol,
  isCrypto,
  cryptoId,
  days = 5,
  frequency = 30,
  frequencyType = "minute",
}: FetchPriceHistoryOptions): Promise<PriceDataPoint[]> {
  try {
    if (isCrypto) {
      if (!cryptoId) throw new Error("Crypto ID is required for crypto assets");
      return await fetchCryptoPriceHistory(cryptoId, days);
    } else {
      return await fetchStockPriceHistory(
        symbol,
        days,
        frequency,
        frequencyType,
      );
    }
  } catch (error) {
    console.error("Error fetching price history:", error);
    throw error;
  }
}
