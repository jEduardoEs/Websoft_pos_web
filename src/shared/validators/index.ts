import { cleanNIT } from '../strings'

export function isValidEmail(email: string): boolean {
  if (!email) return false
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export function isValidNIT(nit: string): boolean {
  const cleaned = cleanNIT(nit)
  if (cleaned === 'CF') return true
  return cleaned.length >= 4 && cleaned.length <= 12
}

export function isValidPhone(phone: string): boolean {
  if (!phone) return false
  const cleaned = phone.replace(/[^0-9+]/g, '')
  return cleaned.length >= 8 && cleaned.length <= 15
}
