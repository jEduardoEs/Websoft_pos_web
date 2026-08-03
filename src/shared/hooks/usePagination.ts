'use client'
import { useState, useMemo, useCallback } from 'react'

export function usePagination(initialPage = 1, initialLimit = 15) {
  const [page, setPage] = useState<number>(initialPage)
  const [limit, setLimit] = useState<number>(initialLimit)
  const [total, setTotal] = useState<number>(0)

  const totalPages = useMemo(() => Math.ceil(total / limit) || 1, [total, limit])
  const offset = useMemo(() => (page - 1) * limit, [page, limit])

  const nextPage = useCallback(() => {
    setPage(p => Math.min(p + 1, totalPages))
  }, [totalPages])

  const prevPage = useCallback(() => {
    setPage(p => Math.max(p - 1, 1))
  }, [])

  const resetPage = useCallback(() => {
    setPage(1)
  }, [])

  return {
    page,
    limit,
    total,
    totalPages,
    offset,
    setPage,
    setLimit,
    setTotal,
    nextPage,
    prevPage,
    resetPage,
  }
}
