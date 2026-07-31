export function fmtMoney(n: number, compact = false): string {
  if (compact && Math.abs(n) >= 1_000_000) {
    return `$${(n / 1_000_000).toFixed(1)}M`;
  }
  if (compact && Math.abs(n) >= 1_000) {
    return `$${(n / 1_000).toFixed(1)}K`;
  }
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: n % 1 === 0 ? 0 : 2 })}`;
}

export function fmtInt(n: number): string {
  return n.toLocaleString("en-US");
}

export function fmtPct(n: number, digits = 0): string {
  return `${n.toFixed(digits)}%`;
}

export function fmtKwh(n: number): string {
  if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(2)} MWh`;
  return `${n.toLocaleString("en-US", { maximumFractionDigits: 0 })} kWh`;
}

export function fmtTimeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const mins = Math.max(1, Math.round((Date.now() - then) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}
