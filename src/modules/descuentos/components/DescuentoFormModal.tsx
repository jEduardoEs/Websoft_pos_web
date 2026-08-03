'use client'
import React from 'react'
import { Modal, Button } from '@/ui'
import { DescuentoFormState } from '../types'
import { DescuentoForm } from './DescuentoForm'

export interface DescuentoFormModalProps {
  isOpen: boolean
  form: DescuentoFormState
  loading: boolean
  onChange: (field: keyof DescuentoFormState, value: any) => void
  onClose: () => void
  onSave: () => void
}

export function DescuentoFormModal({
  isOpen,
  form,
  loading,
  onChange,
  onClose,
  onSave,
}: DescuentoFormModalProps) {
  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nuevo Código de Descuento">
      <DescuentoForm form={form} onChange={onChange} />

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
        <Button variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={onSave} isLoading={loading}>
          Guardar
        </Button>
      </div>
    </Modal>
  )
}
