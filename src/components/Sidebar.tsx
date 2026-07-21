'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { parsePermisos, tienePermiso } from '@/lib/permisos'

interface NavItem {
  href: string
  label: string
  modulo: string
  icon: string
  roles?: string[] // if set, only these roles can see it; empty/undefined = all roles
}

interface NavGroup {
  id: string
  label: string
  icon: string
  roles?: string[] // if set, only these roles see the group
  items: NavItem[]
}

const GROUPS: NavGroup[] = [
  {
    id: 'ventas',
    label: 'Ventas',
    icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z',
    items: [
      { href: '/pos',          label: 'Nueva Venta',   modulo: 'pos',          icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6' },
      { href: '/pedidos',      label: 'Pedidos Web',   modulo: 'pedidos',      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
      { href: '/ventas',       label: 'Historial',     modulo: 'ventas',       icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2' },
      { href: '/cotizaciones', label: 'Cotizaciones',  modulo: 'cotizaciones', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
      { href: '/proyectos',    label: 'Proyectos',     modulo: 'proyectos',    icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
      { href: '/devoluciones', label: 'Devoluciones',  modulo: 'devoluciones', icon: 'M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6' },
      { href: '/descuentos',   label: 'Descuentos',    modulo: 'descuentos',   icon: 'M7 7h.01M17 17h.01M7 7l10 10M3.5 3.5l17 17', roles: ['admin'] },
    ],
  },
  {
    id: 'operaciones',
    label: 'Operaciones',
    icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
    items: [
      { href: '/inventario',   label: 'Inventario',    modulo: 'inventario',   icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
      { href: '/clientes',     label: 'Clientes',      modulo: 'clientes',     icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
      { href: '/campanas',     label: 'Campañas WA',   modulo: 'campanas',     icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
      { href: '/garantias',       label: 'Garantias',     modulo: 'garantias',      icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
      { href: '/servicio',         label: 'Servicio Tec.', modulo: 'servicio',       icon: 'M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z' },
      { href: '/caja',         label: 'Caja',          modulo: 'caja',         icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
    ],
  },
  {
    id: 'contabilidad',
    label: 'Contabilidad',
    icon: 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z',
    roles: ['admin', 'contador'],
    items: [
      { href: '/contabilidad', label: 'Modulo contable',    modulo: 'contabilidad', icon: 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z', roles: ['admin','contador'] },
      { href: '/cuentas',      label: 'Cuentas por cobrar/pagar', modulo: 'cuentas', icon: 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6', roles: ['admin','contador'] },
    ],
  },
  {
    id: 'administracion',
    label: 'Administracion',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    roles: ['admin'],
    items: [
      { href: '/proveedores',  label: 'Proveedores',   modulo: 'proveedores',  icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
      { href: '/compras',      label: 'Compras',       modulo: 'compras',      icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
      { href: '/cierres',      label: 'Cierres',       modulo: 'cierres',      icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
      { href: '/presupuesto',  label: 'Presupuesto',   modulo: 'presupuesto',  icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
      { href: '/reportes',     label: 'Reportes',      modulo: 'reportes',     icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
      { href: '/fel',          label: 'FEL / SAT',     modulo: 'fel',          icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    ],
  },
  {
    id: 'sistema',
    label: 'Sistema',
    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
    roles: ['admin'],
    items: [
      { href: '/usuarios',     label: 'Usuarios',        modulo: 'usuarios',  icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
      { href: '/metas',         label: 'Metas de Ventas', modulo: 'usuarios',  icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
      { href: '/roles',        label: 'Roles',           modulo: 'roles',     icon: 'M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7zm4 3h2m-2 4h6m6-7v10' },
      { href: '/sesiones',     label: 'Sesiones Activas',modulo: 'sesiones',  icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
      { href: '/config',       label: 'Configuracion',   modulo: 'config',    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
      { href: '/auditoria',    label: 'Auditoria',       modulo: 'auditoria', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session, update } = useSession()
  const rol = (session?.user?.role || 'cajero') as string
  const permisos = parsePermisos((session?.user as any)?.permisos || '')

  // Al montar, refrescar permisos desde la DB una sola vez por sesión de navegador
  useEffect(() => {
    const yaRefrescado = sessionStorage.getItem('permisos_refrescados')
    if (!session) return
    // Si el rol no es predefinido y los permisos están vacíos, forzar refresh siempre
    const rolesPredefinidos = ['admin', 'cajero', 'supervisor', 'bodega', 'contador']
    const esRolPersonalizado = !rolesPredefinidos.includes(rol)
    if (!yaRefrescado || (esRolPersonalizado && permisos.length === 0)) {
      sessionStorage.setItem('permisos_refrescados', '1')
      update()
    }
  }, [session, update, rol, permisos])

  const getDefaultOpen = () => {
    const open: Record<string, boolean> = {}
    GROUPS.forEach(g => { open[g.id] = g.items.some(item => pathname === item.href || pathname.startsWith(item.href)) })
    if (!Object.values(open).some(Boolean)) open['ventas'] = true
    return open
  }

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(getDefaultOpen)
  const toggleGroup = (id: string) => setOpenGroups(prev => ({ ...prev, [id]: !prev[id] }))

  const canSeeGroup = (group: NavGroup) => {
    if (group.roles && !group.roles.includes(rol)) return false
    return group.items.some(item => canSeeItem(item))
  }

  const canSeeItem = (item: NavItem) => {
    if (item.roles && !item.roles.includes(rol)) return false
    if (rol === 'admin') return true
    return tienePermiso(permisos, item.modulo, rol)
  }

  return (
    <aside style={{ width: 210, background: '#fff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
      <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 6px' }}>
        {/* Dashboard */}
        <Link href="/dashboard" style={{ textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 7, marginBottom: 6, background: pathname === '/dashboard' ? '#eff6ff' : 'transparent', color: pathname === '/dashboard' ? '#2563eb' : '#475569', fontSize: 13, fontWeight: pathname === '/dashboard' ? 700 : 500, transition: 'all .12s' }}>
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ color: pathname === '/dashboard' ? '#2563eb' : '#94a3b8', flexShrink: 0 }}>
              <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Dashboard
          </div>
        </Link>

        {GROUPS.map(group => {
          if (!canSeeGroup(group)) return null
          const isOpen = openGroups[group.id]
          const hasActive = group.items.some(item => pathname === item.href || pathname.startsWith(item.href))

          return (
            <div key={group.id} style={{ marginBottom: 2 }}>
              <button onClick={() => toggleGroup(group.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 7, border: 'none', cursor: 'pointer', background: hasActive && !isOpen ? '#eff6ff' : 'transparent', color: hasActive ? '#2563eb' : '#374151', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', transition: 'all .12s', textAlign: 'left' }}>
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ color: hasActive ? '#2563eb' : '#94a3b8', flexShrink: 0 }}>
                  <path d={group.icon} />
                </svg>
                <span style={{ flex: 1 }}>{group.label}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#94a3b8', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform .2s', flexShrink: 0 }}>
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {isOpen && (
                <div style={{ paddingLeft: 12, marginTop: 2 }}>
                  {group.items.map(item => {
                    if (!canSeeItem(item)) return null
                    const active = pathname === item.href || pathname.startsWith(item.href)
                    return (
                      <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 9px', borderRadius: 6, marginBottom: 1, background: active ? '#eff6ff' : 'transparent', color: active ? '#2563eb' : '#64748b', fontSize: 12, fontWeight: active ? 600 : 400, borderLeft: `2px solid ${active ? '#2563eb' : 'transparent'}`, transition: 'all .12s' }}>
                          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ color: active ? '#2563eb' : '#94a3b8', flexShrink: 0 }}>
                            <path d={item.icon} />
                          </svg>
                          {item.label}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      <div style={{ padding: '10px 12px', borderTop: '1px solid #f1f5f9' }}>
        <div style={{ fontSize: 9, color: '#cbd5e1', textAlign: 'center', letterSpacing: .5 }}>WebSoft Solutions · Guastatoya</div>
      </div>
    </aside>
  )
}
