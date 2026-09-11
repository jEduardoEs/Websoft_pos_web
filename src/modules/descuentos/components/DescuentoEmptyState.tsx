'use client'
import React from 'react'

export interface DescuentoEmptyStateProps {
  message?: string
}

export function DescuentoEmptyState({ message = 'No hay códigos de descuento creados' }: DescuentoEmptyStateProps) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
      <p style={{ fontSize: 14, margin: 0 }}>{message}</p>
    </div>
  )
}
