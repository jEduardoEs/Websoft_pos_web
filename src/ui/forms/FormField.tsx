'use client'
import React from 'react'

export interface FormFieldProps {
  label?: string
  required?: boolean
  error?: string
  children: React.ReactNode
}

export function FormField({ label, required, error, children }: FormFieldProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12, width: '100%' }}>
      {label && (
        <label style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>
          {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
        </label>
      )}
      {children}
      {error && <span style={{ color: '#ef4444', fontSize: 12 }}>{error}</span>}
    </div>
  )
}
