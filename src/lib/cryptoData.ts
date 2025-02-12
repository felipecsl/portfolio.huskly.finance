import { Asset } from "@/types/crypto";
import { PriceDataPoint } from "./stockData";
import { cacheFetch } from "./cache";

export const cryptoSymbols: { [key: string]: string } = {
  BTC: "bitcoin",
  ETH: "ethereum",
  USDT: "tether",
  BNB: "binance-coin",
  USDC: "usd-coin",
  XRP: "xrp",
  ADA: "cardano",
  DOGE: "dogecoin",
  SOL: "solana",
  TRX: "tron",
  DOT: "polkadot",
  MATIC: "polygon",
  DAI: "dai",
  LTC: "litecoin",
  SHIB: "shiba-inu",
  AVAX: "avalanche",
  LINK: "chainlink",
  XLM: "stellar",
  UNI: "uniswap",
  ATOM: "cosmos",
};

export const isCrypto = (symbol: string) => {
  return cryptoSymbols.hasOwnProperty(symbol);
};

export async function fetchCryptoAssets(
  symbols: Set<string>,
): Promise<Asset[]> {
  const data = await cacheFetch("crypto-assets", async () => {
    const response = await fetch(`https://api.coincap.io/v2/assets`);
    if (!response.ok) {
      throw new Error("Failed to fetch crypto data");
    }
    const { data } = await response.json();
    return data;
  });

  return data
    .filter((asset: any) => [...symbols].includes(asset.symbol))
    .map((asset: any) => ({
      id: asset.id,
      symbol: asset.symbol,
      name: asset.name,
      priceUsd: asset.priceUsd,
      rank: "0",
      type: "crypto",
      supply: asset.supply,
      maxSupply: asset.maxSupply,
      marketCapUsd: asset.marketCapUsd,
      volumeUsd24Hr: asset.volumeUsd24Hr,
      changePercent24Hr: asset.changePercent24Hr,
      vwap24Hr: asset.vwap24Hr,
    }));
}

export async function fetchCryptoPriceHistory(
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
    .sort((a: PriceDataPoint, b: PriceDataPoint) => a.timestamp - b.timestamp);
}
