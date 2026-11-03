import { describeInverse, describeRate } from "@/lib/currencyMath";

/**
 * ✅ Rate দুই দিক থেকেই, দুটোই "1" দিয়ে — "1 MYR = 26.50 BDT" আর নিচে "1 BDT = RM 0.0377"
 * inline দিলে এক লাইনে: "1 MYR = 26.50 BDT · 1 BDT = RM 0.0377"
 */
const RateDisplay = ({ rate, currency, inline = false, className = "" }) => {
  const main = describeRate(rate, currency);
  const inverse = describeInverse(rate, currency);
  if (main === "—") return <span className={`text-slate-400 ${className}`}>—</span>;

  if (inline) {
    return (
      <span className={`tabular-nums ${className}`}>
        {main}
        {inverse && <span className="text-slate-500"> · {inverse}</span>}
      </span>
    );
  }
  return (
    <span className={`inline-flex flex-col tabular-nums ${className}`}>
      <span className="font-medium text-slate-900">{main}</span>
      {inverse && <span className="text-xs font-normal text-slate-500">{inverse}</span>}
    </span>
  );
};

export default RateDisplay;
