import { useQuery } from "@tanstack/react-query";
import { Asset } from "@/types/crypto";
import { AssetList } from "@/components/AssetList";

const Index = () => {
  const { data: assets, isLoading, error } = useQuery({
    queryKey: ["assets"],
    queryFn: async () => {
      const response = await fetch("https://api.coincap.io/v2/assets");
      const data = await response.json();
      return data.data as Asset[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="brutal-border bg-brutal-white p-4">
          Loading assets...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="brutal-border bg-brutal-white p-4 text-red-600">
          Error loading assets
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-8 text-center">Crypto Assets</h1>
      <AssetList assets={assets} />
    </div>
  );
};

export default Index;