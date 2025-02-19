import { Asset } from "@/types/crypto";
import { isEmpty } from "lodash";
import { cacheGet, cacheSet } from "./cache";
import { fetchCryptoPriceHistory } from "./cryptoData";
import { fetchSchwabPriceHistory, fetchSchwabQuotes } from "./schwabApi";

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

export async function fetchStockQuotes(
  symbols: string[],
): Promise<Map<string, StockQuote>> {
  const quotes = new Map<string, StockQuote>();
  const symbolsToFetch: string[] = [];

  // First check cache for each symbol
  for (const symbol of symbols) {
    const cachedQuote = cacheGet<StockQuote>(`stock-quote-${symbol}`);
    if (cachedQuote) {
      quotes.set(symbol, cachedQuote);
    } else {
      symbolsToFetch.push(symbol);
    }
  }

  // If we have symbols that need fetching
  if (!isEmpty(symbolsToFetch)) {
    try {
      const data = await fetchSchwabQuotes(symbolsToFetch);
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
          cacheSet(quoteCacheKey, quote);

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

export async function fetchStockAssets(symbols: Set<string>): Promise<Asset[]> {
  const quotes = await fetchStockQuotes(Array.from(symbols));

  // Map to assets
  return Array.from(symbols).map((symbol) => {
    const quote = quotes.get(symbol) || { c: 0, dp: 0, name: "" };
    return {
      id: symbol,
      symbol,
      name: quote.name,
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
      return await fetchSchwabPriceHistory(
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
