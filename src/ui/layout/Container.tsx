'use client'
import React from 'react'

export interface ContainerProps {
  children: React.ReactNode
  maxWidth?: number
}

export function Container({ children, maxWidth = 1200 }: ContainerProps) {
  return (
    <div style={{ maxWidth, margin: '0 auto', padding: '0 16px', width: '100%', boxSizing: 'border-box' }}>
      {children}
    </div>
  )
}
