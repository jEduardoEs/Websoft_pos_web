export function formatGTQ(amount: number | null | undefined, symbol = 'Q'): string {
  const val = Number(amount) || 0
  return `${symbol} ${val.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function calculateGravable(totalConIVA: number, rate = 0.12): number {
  if (!totalConIVA) return 0
  return Number((totalConIVA / (1 + rate)).toFixed(6))
}

export function calculateIVA(totalConIVA: number, rate = 0.12): number {
  if (!totalConIVA) return 0
  const gravable = calculateGravable(totalConIVA, rate)
  return Number((totalConIVA - gravable).toFixed(6))
}
