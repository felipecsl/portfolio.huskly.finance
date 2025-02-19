export interface Instrument {
  assetType: string;
  status: string;
  symbol: string;
  description: string;
  instrumentId: number;
  closingPrice: number;
  expirationDate?: string;
  optionDeliverables?: {
    rootSymbol: string;
    strikePercent: number;
    deliverableNumber: number;
    deliverableUnits: number;
    deliverable: {
      assetType: string;
      status: string;
      symbol: string;
      instrumentId: number;
      closingPrice: number;
      type: string;
    };
  }[];
  optionPremiumMultiplier?: number;
  putCall?: "PUT" | "CALL";
  strikePrice?: number;
  type?: string;
  underlyingSymbol?: string;
  underlyingCusip?: string;
}

export interface TransferItem {
  instrument: Instrument;
  amount: number;
  cost: number;
  price?: number;
  positionEffect?: string;
  feeType?: string;
}

export interface Trade {
  activityId: number;
  time: string;
  accountNumber: string;
  type: string;
  status: string;
  subAccount: string;
  tradeDate: string;
  positionId: number;
  orderId: number;
  netAmount: number;
  transferItems: TransferItem[];
}
