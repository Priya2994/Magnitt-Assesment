export function fmtMoney(v) {
  if (v == null) return "-";
  if (Math.abs(v) >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  return `$${Math.round(v / 1e6)}M`;
}
