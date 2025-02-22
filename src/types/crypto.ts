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

export interface AssetWithAmount extends Asset {
  amount: number;
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

export interface Portfolio {
  Name: string;
  Holdings: {
    [key: string]: {
      Asset: {
        Symbol: string;
        Name: string;
      };
      "Total Shares": string;
    };
  };
}

export interface CryptoAssetResponse {
  symbol: string;
  name: string;
  price: number;
  changePercent24h: number;
  type: "crypto";
}
