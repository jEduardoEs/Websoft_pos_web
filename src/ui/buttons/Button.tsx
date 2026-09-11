'use client'
import React from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const getStyles = (): React.CSSProperties => {
    let bg = '#2563eb'
    let color = '#ffffff'
    let border = 'none'

    if (variant === 'secondary') {
      bg = '#f1f5f9'
      color = '#334155'
    } else if (variant === 'danger') {
      bg = '#ef4444'
      color = '#ffffff'
    } else if (variant === 'outline') {
      bg = 'transparent'
      color = '#2563eb'
      border = '1px solid #2563eb'
    } else if (variant === 'ghost') {
      bg = 'transparent'
      color = '#475569'
    }

    const padding = size === 'sm' ? '4px 8px' : size === 'lg' ? '12px 20px' : '8px 14px'
    const fontSize = size === 'sm' ? 12 : size === 'lg' ? 16 : 14

    return {
      background: bg,
      color,
      border,
      padding,
      fontSize,
      borderRadius: 6,
      fontWeight: 600,
      cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
      opacity: disabled || isLoading ? 0.6 : 1,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      justifyContent: 'center',
      fontFamily: 'inherit',
      transition: 'all 0.15s ease',
      ...style,
    }
  }

  return (
    <button disabled={disabled || isLoading} style={getStyles()} {...props}>
      {isLoading ? <span>Cargando...</span> : children}
    </button>
  )
}
