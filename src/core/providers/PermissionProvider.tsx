'use client'
import React, { createContext, useContext } from 'react'
import { usePermissions } from '@/shared/hooks/usePermissions'

interface PermissionContextType {
  role: string
  permissions: string[]
  canAccess: (module: string) => boolean
  isAdmin: boolean
}

const PermissionContext = createContext<PermissionContextType>({
  role: 'cajero',
  permissions: [],
  canAccess: () => false,
  isAdmin: false,
})

export function PermissionProvider({ children }: { children: React.ReactNode }) {
  const perm = usePermissions()

  return <PermissionContext.Provider value={perm}>{children}</PermissionContext.Provider>
}

export const usePermissionContext = () => useContext(PermissionContext)
