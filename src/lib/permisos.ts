// All available modules with their labels
export const MODULOS = [
  { id: 'pos',          label: 'Nueva Venta (POS)',    group: 'Ventas' },
  { id: 'ventas',       label: 'Historial de Ventas',  group: 'Ventas' },
  { id: 'cotizaciones', label: 'Cotizaciones',          group: 'Ventas' },
  { id: 'devoluciones', label: 'Devoluciones',          group: 'Ventas' },
  { id: 'inventario',   label: 'Inventario',            group: 'Inventario' },
  { id: 'clientes',     label: 'Clientes',              group: 'Clientes' },
  { id: 'garantias',    label: 'Garantías',             group: 'Clientes' },
  { id: 'servicio',     label: 'Servicio Técnico',      group: 'Servicios' },
  { id: 'caja',         label: 'Control de Caja',       group: 'Caja' },
  { id: 'pedidos',      label: 'Pedidos Web',            group: 'Ventas' },
  { id: 'proveedores',  label: 'Proveedores',           group: 'Compras' },
  { id: 'compras',      label: 'Compras',               group: 'Compras' },
  { id: 'descuentos',   label: 'Descuentos',            group: 'Admin' },
  { id: 'cierres',      label: 'Cierres de Caja',       group: 'Admin' },
  { id: 'reportes',     label: 'Reportes',              group: 'Admin' },
  { id: 'presupuesto',  label: 'Presupuesto vs Real',   group: 'Admin' },
  { id: 'fel',          label: 'FEL / SAT',             group: 'Admin' },
  { id: 'dashboard',    label: 'Dashboard',             group: 'General' },
]

export const PERMISOS_CAJERO_DEFAULT = [
  'dashboard', 'pos', 'ventas', 'inventario', 'clientes',
  'cotizaciones', 'devoluciones', 'caja', 'garantias', 'servicio',
]

export function parsePermisos(permisos: string | null | undefined): string[] {
  if (!permisos || permisos === '') return []
  try { return JSON.parse(permisos) } catch { return [] }
}

export function tienePermiso(permisos: string[], modulo: string, rol: string): boolean {
  if (rol === 'admin') return true
  if (!permisos || permisos.length === 0) {
    // Default cajero permissions
    return PERMISOS_CAJERO_DEFAULT.includes(modulo)
  }
  return permisos.includes(modulo)
}
