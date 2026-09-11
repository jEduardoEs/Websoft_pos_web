export const DEFAULT_ROLE_PERMISSIONS = {
  ADMIN: ['*'],
  CAJERO: ['dashboard', 'pos', 'ventas', 'clientes', 'cotizaciones', 'devoluciones', 'caja', 'garantias', 'servicio'],
  SUPERVISOR: ['dashboard', 'pos', 'ventas', 'pedidos', 'clientes', 'inventario', 'cotizaciones', 'devoluciones', 'caja', 'garantias', 'servicio', 'descuentos', 'cierres', 'reportes', 'presupuesto'],
  BODEGA: ['dashboard', 'inventario', 'compras', 'proveedores'],
  CONTADOR: ['dashboard', 'contabilidad', 'cuentas'],
} as const
