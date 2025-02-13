export function isCrypto(holding: { Asset: { Symbol: string } }) {
  return holding.Asset.Symbol.includes(" : USD");
}

export function parseSymbol(holding: { Asset: { Symbol: string } }) {
  if (!holding.Asset.Symbol || !holding.Asset.Symbol.includes(":")) {
    console.warn(`Invalid symbol`, holding);
    return "";
  }
  return isCrypto(holding)
    ? holding.Asset.Symbol.split(" : ")[0]
    : holding.Asset.Symbol.split(":")[1];
}
