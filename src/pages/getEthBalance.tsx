import { cacheGet, cacheSet } from "@/lib/cache";

export async function getEthBalance(address: string): Promise<number> {
  // Check cache first
  const cacheKey = `eth-balance-${address}`;
  const cached = cacheGet<number>(cacheKey);
  if (cached !== null) return cached;

  // Query Etherscan API for ETH balance
  const ETHERSCAN_API_KEY = import.meta.env.VITE_ETHERSCAN_API_KEY;
  const baseUrl = "https://api.etherscan.io/api";

  const response = await fetch(
    `${baseUrl}?module=account&action=balance&address=${address}&tag=latest&apikey=${ETHERSCAN_API_KEY}`,
  );
  const data = await response.json();

  if (data.status === "1" && data.message === "OK") {
    // Convert wei to ETH (1 ETH = 10^18 wei)
    const balance = Number(data.result) / 1e18;
    // Cache the result
    cacheSet(cacheKey, balance);
    return balance;
  }
  throw new Error("Failed to fetch ETH balance");
}
