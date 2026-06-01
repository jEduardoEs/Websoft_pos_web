'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { MODULOS, parsePermisos, tienePermiso } from '@/lib/permisos'

const NAV = [
  { href: '/dashboard',    label: 'Dashboard',     modulo: 'dashboard',    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', adminOnly: false },
  { href: '/pos',          label: 'Nueva Venta',   modulo: 'pos',          icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z', adminOnly: false },
  { href: '/pedidos',      label: 'Pedidos Web',   modulo: 'pedidos',      icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z', adminOnly: false },
  { href: '/ventas',       label: 'Ventas',        modulo: 'ventas',       icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', adminOnly: false },
  { href: '/inventario',   label: 'Inventario',    modulo: 'inventario',   icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', adminOnly: false },
  { href: '/cotizaciones', label: 'Cotizaciones',  modulo: 'cotizaciones', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', adminOnly: false },
  { href: '/clientes',     label: 'Clientes',      modulo: 'clientes',     icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', adminOnly: false },
  { href: '/garantias',    label: 'Garantias',     modulo: 'garantias',    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', adminOnly: false },
  { href: '/servicio',     label: 'Servicio Tec.', modulo: 'servicio',     icon: 'M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z', adminOnly: false },
  { href: '/devoluciones', label: 'Devoluciones',  modulo: 'devoluciones', icon: 'M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6', adminOnly: false },
  { href: '/caja',         label: 'Caja',          modulo: 'caja',         icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z', adminOnly: false },
  { href: '/proveedores',  label: 'Proveedores',   modulo: 'proveedores',  icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4', adminOnly: true, section: 'Administracion' },
  { href: '/compras',      label: 'Compras',       modulo: 'compras',      icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z', adminOnly: true },
  { href: '/descuentos',   label: 'Descuentos',    modulo: 'descuentos',   icon: 'M7 7h.01M17 17h.01M7 7l10 10M3.5 3.5l17 17', adminOnly: true },
  { href: '/cierres',      label: 'Cierres',       modulo: 'cierres',      icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', adminOnly: true },
  { href: '/presupuesto',  label: 'Presupuesto',   modulo: 'presupuesto',  icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6', adminOnly: true, section: 'Analisis' },
  { href: '/reportes',     label: 'Reportes',      modulo: 'reportes',     icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', adminOnly: true },
  { href: '/fel',          label: 'FEL / SAT',     modulo: 'fel',          icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', adminOnly: true },
  { href: '/usuarios',     label: 'Usuarios',      modulo: 'usuarios',     icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', adminOnly: true, section: 'Sistema' },
  { href: '/config',       label: 'Configuracion', modulo: 'config',       icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z', adminOnly: true },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const rol = session?.user?.role || 'cajero'
  const permisos = parsePermisos((session?.user as any)?.permisos || '')

  const visible = NAV.filter(n => {
    if (n.adminOnly && rol !== 'admin') return false
    return tienePermiso(permisos, n.modulo, rol)
  })

  return (
    <aside style={{
      width: 204, background: '#ffffff', borderRight: '1px solid #e2e8f0',
      display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0,
    }}>
      <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 6px' }}>
        {visible.map(({ href, label, icon, section }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href))
          return (
            <div key={href}>
              {section && (
                <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: 1, padding: '14px 10px 5px', textTransform: 'uppercase' }}>
                  {section}
                </div>
              )}
              <Link href={href} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 9,
                  padding: '7px 9px', borderRadius: 6, marginBottom: 1,
                  cursor: 'pointer', fontSize: 12,
                  fontWeight: active ? 600 : 400,
                  color: active ? '#2563eb' : '#475569',
                  background: active ? '#eff6ff' : 'transparent',
                  transition: 'all .12s',
                }}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"
                    style={{ color: active ? '#2563eb' : '#94a3b8', flexShrink: 0 }}>
                    <path d={icon} />
                  </svg>
                  {label}
                </div>
              </Link>
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
