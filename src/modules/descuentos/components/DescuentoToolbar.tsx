'use client'
import React from 'react'
import { Button } from '@/ui'

export interface DescuentoToolbarProps {
  onNuevoCodigo: () => void
}

export function DescuentoToolbar({ onNuevoCodigo }: DescuentoToolbarProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a' }}>Descuentos</h1>
        <p style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>
          Códigos de descuento para ventas
        </p>
      </div>
      <Button variant="primary" onClick={onNuevoCodigo}>
        + Nuevo Código
      </Button>
    </div>
  )
}
