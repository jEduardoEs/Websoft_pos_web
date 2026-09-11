'use client'
import { useState, useCallback } from 'react'

export function useAsync<T>() {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)

  const run = useCallback(async (promise: Promise<T>): Promise<T | null> => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await promise
      setData(result)
      return result
    } catch (e: any) {
      setError(e instanceof Error ? e : new Error(String(e)))
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { data, isLoading, error, run }
}
