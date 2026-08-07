'use client'
import React from 'react'
import { Card } from '@/ui'
import { useDescuentos } from '../hooks/useDescuentos'
import { DescuentoToolbar } from '../components/DescuentoToolbar'
import { DescuentosTabla } from '../components/DescuentosTabla'
import { DescuentoFormModal } from '../components/DescuentoFormModal'

export function DescuentosView() {
  const {
    descuentos,
    showModal,
    form,
    loading,
    setForm,
    openNew,
    closeModal,
    save,
    del,
    activar,
  } = useDescuentos()

  const handleFormChange = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <DescuentoToolbar onNuevoCodigo={openNew} />

      <Card>
        <DescuentosTabla descuentos={descuentos} onDesactivar={del} onActivar={activar} />
      </Card>

      <DescuentoFormModal
        isOpen={showModal}
        form={form}
        loading={loading}
        onChange={handleFormChange}
        onClose={closeModal}
        onSave={save}
      />
    </div>
  )
}
