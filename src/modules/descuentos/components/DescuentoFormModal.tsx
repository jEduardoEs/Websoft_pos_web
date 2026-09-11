'use client'
import React from 'react'
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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, overflowY: 'auto' }}>
      <div className="card" style={{ width: 500, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', padding: 28, background: '#fff', borderRadius: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#18181b', margin: 0 }}>
            {form.id > 0 ? 'Editar Código de Descuento' : 'Nuevo Código de Descuento'}
          </h3>
          <button onClick={onClose} type="button" style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#8a887e' }}>
            ×
          </button>
        </div>

        <DescuentoForm form={form} onChange={onChange} />

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24, paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
          <button className="btn-secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button className="btn-primary" onClick={onSave} disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}
