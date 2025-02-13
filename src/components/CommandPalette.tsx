import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

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
        <div className="px-6 py-3 text-sm text-gray-500 border-t border-gray-800">
          Press enter to navigate to asset
        </div>
      </div>
      <div className="fixed inset-0 -z-10" onClick={() => setIsOpen(false)} />
    </div>
  );
}
