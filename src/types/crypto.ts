export interface Asset {
  id: string;
  symbol: string;
  name: string;
  priceUsd: string;
  rank: string;
  type: "crypto" | "stock";
  supply: string;
  maxSupply: string;
  marketCapUsd: string;
  volumeUsd24Hr: string;
  changePercent24Hr: string;
  vwap24Hr: string;
}

export interface AssetHistory {
  priceUsd: string;
  time: number;
  date: string;
}

export interface UserHolding {
  symbol: string;
  name: string;
  amount: number;
}
