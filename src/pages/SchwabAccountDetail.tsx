import { AccountSummary } from "@/components/AccountSummary";
import { AssetTypeTable } from "@/components/AssetTypeTable";
import Logo from "@/components/Logo";
import { usePortfolios } from "@/hooks/usePortfolios";
import { Link, useParams } from "react-router-dom";

const SchwabAccountDetail = () => {
  const { accountNumber } = useParams();
  const { schwabAccounts } = usePortfolios();

  const account = schwabAccounts.find(
    (acc) => acc.accountNumber === accountNumber,
  );

  if (!account) {
    return (
      <div className="min-h-screen p-8 bg-zinc-800">
        <div className="w-full max-w-4xl mx-auto">
          <div className="mb-8">
            <Link
              to="/"
              className="px-4 py-2 text-white bg-stone-900 rounded-lg border border-gray-950 hover:bg-stone-800 transition-colors"
            >
              ← Back to Portfolio
            </Link>
          </div>
          <div className="text-white">Account not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-zinc-800">
      <div className="w-full max-w-4xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <Logo />
          <Link
            to="/"
            className="px-4 py-2 text-white bg-stone-900 rounded-lg border border-gray-950 hover:bg-stone-800 transition-colors"
          >
            ← Back to Portfolio
          </Link>
        </div>
        <AccountSummary account={account} />
        <AssetTypeTable
          positions={account.positions}
          type="stock"
          title="Equities"
          itemLabel="holdings"
        />
        <AssetTypeTable
          positions={account.positions}
          type="option"
          title="Options"
          itemLabel="positions"
        />
      </div>
    </div>
  );
};

export default SchwabAccountDetail;
