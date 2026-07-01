// All available modules with their labels
export const MODULOS = [
  { id: 'pos',          label: 'Nueva Venta (POS)',    group: 'Ventas' },
  { id: 'ventas',       label: 'Historial de Ventas',  group: 'Ventas' },
  { id: 'cotizaciones',    label: 'Cotizaciones',          group: 'Ventas' },
  { id: 'proyectos',      label: 'Proyectos',             group: 'Ventas' },
  { id: 'devoluciones', label: 'Devoluciones',          group: 'Ventas' },
  { id: 'inventario',   label: 'Inventario',            group: 'Inventario' },
  { id: 'clientes',     label: 'Clientes',              group: 'Clientes' },
  { id: 'campanas',     label: 'Campañas WhatsApp',     group: 'Clientes' },
  { id: 'garantias',        label: 'Garantías',             group: 'Clientes' },
  { id: 'servicio',        label: 'Servicio Técnico',      group: 'Servicios' },
  { id: 'caja',         label: 'Control de Caja',       group: 'Caja' },
  { id: 'pedidos',      label: 'Pedidos Web',            group: 'Ventas' },
  { id: 'proveedores',  label: 'Proveedores',           group: 'Compras' },
  { id: 'compras',      label: 'Compras',               group: 'Compras' },
  { id: 'descuentos',   label: 'Descuentos',            group: 'Admin' },
  { id: 'cierres',      label: 'Cierres de Caja',       group: 'Admin' },
  { id: 'contabilidad',   label: 'Contabilidad', group: 'Finanzas' },
  { id: 'cuentas',       label: 'Cuentas por cobrar/pagar', group: 'Finanzas' },
  { id: 'reportes',     label: 'Reportes',              group: 'Admin' },
  { id: 'presupuesto',  label: 'Presupuesto vs Real',   group: 'Admin' },
  { id: 'fel',          label: 'FEL / SAT',             group: 'Admin' },
  { id: 'usuarios',     label: 'Usuarios',              group: 'Sistema' },
  { id: 'roles',        label: 'Roles',                 group: 'Sistema' },
  { id: 'sesiones',     label: 'Sesiones Activas',      group: 'Sistema' },
  { id: 'config',       label: 'Configuracion',         group: 'Sistema' },
  { id: 'auditoria',    label: 'Auditoria',             group: 'Sistema' },
  { id: 'dashboard',    label: 'Dashboard',             group: 'General' },
]

export const PERMISOS_CAJERO_DEFAULT = [
  'dashboard', 'pos', 'ventas', 'clientes',
  'cotizaciones', 'devoluciones', 'caja', 'garantias', 'servicio',
]

export const PERMISOS_SUPERVISOR_DEFAULT = [
  'dashboard', 'pos', 'ventas', 'pedidos', 'clientes', 'inventario',
  'cotizaciones', 'devoluciones', 'caja', 'garantias', 'servicio',
  'descuentos', 'cierres', 'reportes', 'presupuesto',
]

export const PERMISOS_BODEGA_DEFAULT = [
  'dashboard', 'inventario', 'compras', 'proveedores',
]

export const PERMISOS_CONTADOR_DEFAULT = [
  'dashboard', 'contabilidad', 'cuentas',
]

export function parsePermisos(permisos: string | null | undefined): string[] {
  if (!permisos || permisos === '') return []
  try { return JSON.parse(permisos) } catch { return [] }
}

export function tienePermiso(permisos: string[], modulo: string, rol: string): boolean {
  if (rol === 'admin') return true
  // Si el usuario tiene permisos explícitos definidos, usar solo esos (roles 100% libres)
  if (permisos && permisos.length > 0) return permisos.includes(modulo)
  // Fallback solo para roles predefinidos sin permisos asignados aún
  if (rol === 'contador') return PERMISOS_CONTADOR_DEFAULT.includes(modulo)
  if (rol === 'supervisor') return PERMISOS_SUPERVISOR_DEFAULT.includes(modulo)
  if (rol === 'bodega') return PERMISOS_BODEGA_DEFAULT.includes(modulo)
  if (rol === 'cajero') return PERMISOS_CAJERO_DEFAULT.includes(modulo)
  // Rol personalizado sin permisos definidos: sin acceso hasta que se asignen
  return false
}
