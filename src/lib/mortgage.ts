export function estimateMonthlyPayment(
  price: number,
  downPaymentPct = 20,
  annualRate = 6.5,
  termYears = 30,
): number {
  const down = price * (downPaymentPct / 100);
  const principal = price - down;
  const monthlyRate = annualRate / 100 / 12;
  const n = termYears * 12;
  if (monthlyRate === 0) return principal / n;
  return (
    (principal * (monthlyRate * Math.pow(1 + monthlyRate, n))) /
    (Math.pow(1 + monthlyRate, n) - 1)
  );
}

export function formatMonthly(amount: number): string {
  return `$${Math.round(amount).toLocaleString()}/mo`;
}
