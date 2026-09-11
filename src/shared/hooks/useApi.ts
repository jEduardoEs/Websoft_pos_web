'use client'
import { useState, useCallback } from 'react'
import { ApiResponse } from '@/types/api.types'

export function useApi<T>() {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(async (apiCall: () => Promise<ApiResponse<T>>) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await apiCall()
      if (res.ok && res.data !== undefined) {
        setData(res.data)
        return res.data
      } else {
        const err = res.error || 'Error en la petición'
        setError(err)
        return null
      }
    } catch (e: any) {
      const msg = e?.message || 'Error inesperado'
      setError(msg)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { data, isLoading, error, execute, setData, setError }
}
