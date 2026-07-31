import { useState } from 'react'

export function useApi<T>() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  async function request(promise: Promise<T>) {
    setLoading(true)
    setError(null)
    try {
      const result = await promise
      setLoading(false)
      return result
    } catch (err) {
      setLoading(false)
      setError(err as Error)
      throw err
    }
  }

  return { loading, error, request }
}
