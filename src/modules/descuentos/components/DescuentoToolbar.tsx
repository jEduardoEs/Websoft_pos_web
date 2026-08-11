'use client'
import React from 'react'

export interface DescuentoToolbarProps {
  onNuevoCodigo: () => void
}

export function DescuentoToolbar({ onNuevoCodigo }: DescuentoToolbarProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#18181b' }}>Descuentos</h1>
        <p style={{ fontSize: 12, color: '#8a887e', marginTop: 2 }}>
          Consulta y gestiona todos los códigos de descuento del sistema
        </p>
      </div>
      <button className="btn-primary" onClick={onNuevoCodigo}>
        + Nuevo Código
      </button>
    </div>
  )
}
