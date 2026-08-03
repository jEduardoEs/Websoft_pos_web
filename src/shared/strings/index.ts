export function cleanNIT(nit: string | null | undefined): string {
  if (!nit || nit.trim().toUpperCase() === 'CF') return 'CF'
  return nit.replace(/[^0-9Kk]/g, '').toUpperCase()
}

export function capitalize(str: string): string {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function truncate(str: string, maxLen: number): string {
  if (!str || str.length <= maxLen) return str || ''
  return str.slice(0, maxLen) + '...'
}
