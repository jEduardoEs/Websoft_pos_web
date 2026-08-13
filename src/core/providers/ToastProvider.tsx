'use client'
import React from 'react'
import { toast } from 'sonner'

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

export { toast }
