import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import debounce from "lodash/debounce";

interface SearchResult {
  description: string;
  displaySymbol: string;
  symbol: string;
  type: string;
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();

  const fetchResults = useCallback(
    debounce(async (query: string) => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      try {
        const response = await fetch(
          `https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&token=${import.meta.env.VITE_FINNHUB_API_KEY}&exchange=US`,
        );
        const data = await response.json();
        setResults(data.result?.slice(0, 10) || []); // Limit to top 10 results
        setSelectedIndex(0);
      } catch (error) {
        console.error("Error fetching search results:", error);
        setResults([]);
      }
    }, 300),
    [],
  );

  useEffect(() => {
    fetchResults(search);
  }, [search, fetchResults]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/asset/${search.trim().toUpperCase()}`);
      setIsOpen(false);
      setSearch("");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-[15vh] z-50">
      <div className="bg-stone-900 w-full max-w-2xl rounded-lg border border-gray-950 shadow-2xl">
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for an asset symbol..."
            className="w-full bg-stone-900 text-white px-6 py-4 text-xl rounded-lg focus:outline-none [&::placeholder]:normal-case uppercase"
            autoFocus
          />
        </form>

        {results.length > 0 && (
          <div className="max-h-96 overflow-y-auto border-t border-gray-800">
            {results.map((result, index) => (
              <div
                key={result.symbol}
                className={`px-6 py-3 flex justify-between items-center cursor-pointer hover:bg-stone-800 ${
                  index === selectedIndex ? "bg-stone-800" : ""
                }`}
                onClick={() => {
                  navigate(`/asset/${result.symbol}`);
                  setIsOpen(false);
                  setSearch("");
                }}
              >
                <div>
                  <div className="text-white font-medium">{result.symbol}</div>
                  <div className="text-gray-400 text-sm">
                    {result.description}
                  </div>
                </div>
                <span className="text-xs text-gray-500">{result.type}</span>
              </div>
            ))}
          </div>
        )}

        <div className="px-6 py-3 text-sm text-gray-500 border-t border-gray-800">
          {results.length > 0 ? (
            <>Use arrow keys to select and enter to navigate</>
          ) : (
            <>Press enter to navigate to asset</>
          )}
        </div>
      </div>
      <div className="fixed inset-0 -z-10" onClick={() => setIsOpen(false)} />
    </div>
  );
}
