interface PercentageChangeProps {
  value: number;
}

export const PercentageChange = ({ value }: PercentageChangeProps) => {
  return (
    <span
      className={`p-2 rounded ${
        value >= 0
          ? "text-green-950 bg-green-300 font-medium"
          : "text-red-950 bg-red-300 font-medium"
      }`}
    >
      {value >= 0 ? "▲" : "▼"} {Math.abs(value).toFixed(2)}%
    </span>
  );
};
