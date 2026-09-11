'use client'
import { useState, useCallback } from 'react'

export interface ConfirmOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
}

export function useConfirm() {
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean
    options: ConfirmOptions
    resolve: (value: boolean) => void
  } | null>(null)

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>(resolve => {
      setConfirmState({
        isOpen: true,
        options: {
          confirmText: 'Confirmar',
          cancelText: 'Cancelar',
          ...options,
        },
        resolve,
      })
    })
  }, [])

  const handleConfirm = useCallback(() => {
    if (confirmState) {
      confirmState.resolve(true)
      setConfirmState(null)
    }
  }, [confirmState])

  const handleCancel = useCallback(() => {
    if (confirmState) {
      confirmState.resolve(false)
      setConfirmState(null)
    }
  }, [confirmState])

  return {
    confirm,
    isOpen: !!confirmState?.isOpen,
    options: confirmState?.options,
    handleConfirm,
    handleCancel,
  }
}
