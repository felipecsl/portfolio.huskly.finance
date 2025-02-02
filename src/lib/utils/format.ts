export const formatPrice = (price: string | number) => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numPrice);
};

export const formatMarketCap = (marketCap: string | number) => {
  const num = typeof marketCap === 'string' ? parseFloat(marketCap) : marketCap;
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  return `$${num.toFixed(2)}`;
};

export const formatPercentage = (percent: string | number) => {
  const num = typeof percent === 'string' ? parseFloat(percent) : percent;
  return `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`;
};