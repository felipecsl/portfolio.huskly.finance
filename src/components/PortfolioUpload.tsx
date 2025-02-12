import { Portfolio } from "@/types/crypto";

interface PortfolioUploadProps {
  onUpload: (portfolio: Portfolio) => void;
}

export function PortfolioUpload({ onUpload }: PortfolioUploadProps) {
  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files) return;

    for (const file of files) {
      try {
        const text = await file.text();
        const portfolio = JSON.parse(text);

        // Validate portfolio has required fields
        if (!portfolio.Name || !Array.isArray(portfolio.Holdings)) {
          throw new Error("Invalid portfolio format");
        }

        onUpload(portfolio);
      } catch (error) {
        console.error(`Error loading portfolio from ${file.name}:`, error);
        // You might want to show an error toast here
      }
    }

    // Reset the input
    event.target.value = "";
  };

  return (
    <div className="flex flex-col items-center gap-4 p-8 border-2 border-dashed border-gray-600 rounded-lg">
      <p className="text-gray-400">Upload your portfolio JSON files</p>
      <input
        type="file"
        accept=".json"
        multiple
        onChange={handleFileChange}
        className="block w-full text-sm text-gray-400
          file:mr-4 file:py-2 file:px-4
          file:rounded-full file:border-0
          file:text-sm file:font-semibold
          file:bg-stone-700 file:text-white
          hover:file:bg-stone-600"
      />
    </div>
  );
}
