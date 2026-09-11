import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function fmt(n: number | null | undefined, symbol = 'Q') {
  return `${symbol} ${((+n!) || 0).toFixed(2)}`
}

export function fmtDate(d: Date | string | null | undefined) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function fmtDateTime(d: Date | string | null | undefined) {
  if (!d) return ''
  return new Date(d).toLocaleString('es-GT', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export async function apiPost<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Error ${res.status}`)
  }
  return res.json()
}

export async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Error ${res.status}`)
  return res.json()
}

export async function apiDelete(url: string) {
  const res = await fetch(url, { method: 'DELETE' })
  if (!res.ok) throw new Error(`Error ${res.status}`)
  return res.json()
}
