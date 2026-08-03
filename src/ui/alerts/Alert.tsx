'use client'
import React from 'react'

export interface AlertProps {
  type?: 'info' | 'success' | 'warning' | 'error'
  message: string
}

export function Alert({ type = 'info', message }: AlertProps) {
  const colors = {
    info: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
    success: { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
    warning: { bg: '#fffbeb', color: '#b45309', border: '#fde68a' },
    error: { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' },
  }

  const style = colors[type]

  return (
    <div
      style={{
        padding: '10px 14px',
        borderRadius: 6,
        background: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
        fontSize: 13,
        marginBottom: 12,
      }}
    >
      {message}
    </div>
  )
}
