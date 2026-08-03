export type UserRole = 'admin' | 'cajero' | 'supervisor' | 'bodega' | 'contador' | string

export type PermissionModule =
  | 'pos'
  | 'ventas'
  | 'cotizaciones'
  | 'proyectos'
  | 'devoluciones'
  | 'inventario'
  | 'clientes'
  | 'campanas'
  | 'garantias'
  | 'servicio'
  | 'caja'
  | 'pedidos'
  | 'proveedores'
  | 'compras'
  | 'descuentos'
  | 'cierres'
  | 'contabilidad'
  | 'cuentas'
  | 'reportes'
  | 'presupuesto'
  | 'fel'
  | 'usuarios'
  | 'roles'
  | 'sesiones'
  | 'config'
  | 'auditoria'
  | 'dashboard'

export interface PermissionCheck {
  module: PermissionModule
  role: UserRole
  hasAccess: boolean
}
