'use client'
import { useSession } from 'next-auth/react'
import ProyectosListModule from '@/modules/proyectos/components/ProyectosListModule'

export default function ProyectosPage() {
  const { data: session } = useSession()
  const rol = (session?.user as any)?.role || ''
  const esAdminOSupervisor = rol === 'admin' || rol === 'supervisor'

  return <ProyectosListModule esAdminOSupervisor={esAdminOSupervisor} />
}
