export async function fetchBitcoinPrice(): Promise<number> {
  try {
    const response = await fetch('https://api.coinbase.com/v2/prices/BTC-USD/spot');
    const data = await response.json();
    return parseFloat(data.data.amount);
  } catch (error) {
    console.error('Failed to fetch Bitcoin price:', error);
    return 0;
  }
}

export function formatBTC(amount: number): string {
  return `${amount.toFixed(8)} BTC`;
}

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function calculateWealthProjection(
  currentBalance: number,
  monthlyInvestment: number,
  years: number,
  annualReturnRate: number = 0.10
): { year: number; value: number }[] {
  const projections = [];
  let balance = currentBalance;

  for (let year = 1; year <= years; year++) {
    for (let month = 0; month < 12; month++) {
      balance += monthlyInvestment;
      balance *= (1 + annualReturnRate / 12);
    }
    projections.push({ year, value: balance });
  }

  return projections;
}
