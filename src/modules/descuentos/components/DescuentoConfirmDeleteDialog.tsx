'use client'
import React from 'react'
import { Modal, Button } from '@/ui'

export interface DescuentoConfirmDeleteDialogProps {
  isOpen: boolean
  codigo: string
  onConfirm: () => void
  onClose: () => void
}

export function DescuentoConfirmDeleteDialog({
  isOpen,
  codigo,
  onConfirm,
  onClose,
}: DescuentoConfirmDeleteDialogProps) {
  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Desactivar Código">
      <p style={{ fontSize: 14, color: '#334155', margin: '0 0 20px 0' }}>
        ¿Estás seguro de que deseas desactivar el código de descuento <strong>&quot;{codigo}&quot;</strong>?
      </p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <Button variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          Desactivar
        </Button>
      </div>
    </Modal>
  )
}
