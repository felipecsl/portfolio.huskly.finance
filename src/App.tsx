import { HashRouter as Router, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import AssetDetail from "./pages/AssetDetail";
import { CommandPalette } from "./components/CommandPalette";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import NotFound from "./pages/NotFound";
import Transactions from "./pages/Transactions";
import SchwabAccountDetail from "./pages/SchwabAccountDetail";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <CommandPalette />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/asset/:symbol" element={<AssetDetail />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route
            path="/account/:accountNumber"
            element={<SchwabAccountDetail />}
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
};

export default App;
