'use client'

import React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { parsePermisos, tienePermiso } from '@/lib/permisos'

const ROUTE_MODULE_MAP: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/pos': 'pos',
  '/pedidos': 'pedidos',
  '/ventas': 'ventas',
  '/cotizaciones': 'cotizaciones',
  '/proyectos': 'proyectos',
  '/devoluciones': 'devoluciones',
  '/descuentos': 'descuentos',
  '/inventario': 'inventario',
  '/clientes': 'clientes',
  '/campanas': 'campanas',
  '/garantias': 'garantias',
  '/servicio': 'servicio',
  '/caja': 'caja',
  '/contabilidad': 'contabilidad',
  '/cuentas': 'cuentas',
  '/proveedores': 'proveedores',
  '/compras': 'compras',
  '/cierres': 'cierres',
  '/presupuesto': 'presupuesto',
  '/reportes': 'reportes',
  '/fel': 'fel',
  '/usuarios': 'usuarios',
  '/metas': 'usuarios',
  '/roles': 'roles',
  '/sesiones': 'sesiones',
  '/config': 'config',
  '/auditoria': 'auditoria',
}

const DEFAULT_ROLE_HOME: Record<string, string> = {
  admin: '/dashboard',
  contador: '/contabilidad',
  bodega: '/inventario',
  cajero: '/pos',
  supervisor: '/dashboard',
}

export function RoutePermissionGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b', fontSize: 14 }}>
        Cargando...
      </div>
    )
  }

  const rol = (session?.user?.role || 'cajero') as string
  const permisos = parsePermisos((session?.user as any)?.permisos || '')

  if (rol === 'admin') {
    return <>{children}</>
  }

  // Determine current module from pathname
  const currentPath = pathname.split('?')[0]
  const matchedRoute = Object.keys(ROUTE_MODULE_MAP).find(r => currentPath === r || currentPath.startsWith(r + '/'))
  const modulo = matchedRoute ? ROUTE_MODULE_MAP[matchedRoute] : null

  if (modulo && !tienePermiso(permisos, modulo, rol)) {
    const defaultHome = DEFAULT_ROLE_HOME[rol] || '/dashboard'

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '60vh', padding: 24, textAlign: 'center' }}>
        <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '36px 28px', maxWidth: 460, boxShadow: '0 10px 25px rgba(0,0,0,.05)' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 24, fontWeight: 700 }}>
            !
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>Acceso Restringido por Rol</h2>
          <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5, margin: '0 0 24px' }}>
            Tu usuario posee el rol <strong style={{ color: '#1e293b', textTransform: 'capitalize' }}>{rol}</strong> y no cuenta con permisos para acceder a esta sección.
          </p>
          <button
            onClick={() => router.push(defaultHome)}
            style={{ background: '#1581E3', color: '#fff', border: 'none', borderRadius: 7, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'background .15s' }}
          >
            Ir a mi módulo principal ({defaultHome})
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
