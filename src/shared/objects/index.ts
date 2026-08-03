export function isEmpty(obj: unknown): boolean {
  if (obj === null || obj === undefined) return true
  if (Array.isArray(obj) || typeof obj === 'string') return obj.length === 0
  if (typeof obj === 'object') return Object.keys(obj as object).length === 0
  return false
}

export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}
