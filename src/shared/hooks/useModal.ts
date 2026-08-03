'use client'
import { useState, useCallback } from 'react'

export function useModal<T = unknown>(initialOpen = false) {
  const [isOpen, setIsOpen] = useState<boolean>(initialOpen)
  const [data, setData] = useState<T | null>(null)

  const openModal = useCallback((payload?: T) => {
    if (payload !== undefined) setData(payload)
    setIsOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setIsOpen(false)
    setData(null)
  }, [])

  const toggleModal = useCallback(() => {
    setIsOpen(prev => !prev)
  }, [])

  return { isOpen, data, openModal, closeModal, toggleModal, setData }
}
