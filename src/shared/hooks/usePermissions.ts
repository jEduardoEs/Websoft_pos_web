'use client'
import { useSession } from 'next-auth/react'
import { parsePermisos, tienePermiso } from '@/lib/permisos'

export function usePermissions() {
  const { data: session } = useSession()
  const role = (session?.user?.role || 'cajero') as string
  const permissions = parsePermisos((session?.user as any)?.permisos || '')

  const canAccess = (module: string): boolean => {
    if (role === 'admin') return true
    return tienePermiso(permissions, module, role)
  }

  return { role, permissions, canAccess, isAdmin: role === 'admin' }
}
