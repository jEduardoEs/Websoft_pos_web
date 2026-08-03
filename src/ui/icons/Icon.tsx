'use client'
import React from 'react'

export interface IconProps {
  name?: string
  size?: number
  color?: string
  children?: React.ReactNode
}

export function Icon({ size = 18, color = 'currentColor', children }: IconProps) {
  return (
    <span style={{ display: 'inline-flex', width: size, height: size, color, alignItems: 'center', justifyContent: 'center' }}>
      {children}
    </span>
  )
}
