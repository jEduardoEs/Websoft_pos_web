export function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max)
}

export function roundTo(val: number, decimals = 2): number {
  const factor = Math.pow(10, decimals)
  return Math.round((val + Number.EPSILON) * factor) / factor
}

export function formatPercent(val: number, decimals = 2): string {
  return `${roundTo(val, decimals)}%`
}
