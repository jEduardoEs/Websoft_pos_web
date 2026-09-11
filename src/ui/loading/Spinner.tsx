'use client'
import React from 'react'

export interface SpinnerProps {
  size?: number
  color?: string
}

export function Spinner({ size = 20, color = '#2563eb' }: SpinnerProps) {
  return (
    <div
      style={{
        width: size,
        height: size,
        border: `2px solid #e2e8f0`,
        borderTopColor: color,
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
        display: 'inline-block',
      }}
    />
  )
}
