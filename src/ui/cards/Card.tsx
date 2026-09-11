'use client'
import React from 'react'

export interface CardProps {
  children: React.ReactNode
  style?: React.CSSProperties
}

export function Card({ children, style }: CardProps) {
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 8,
        padding: 16,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
