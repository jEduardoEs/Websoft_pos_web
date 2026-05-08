const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  login:          (d)  => ipcRenderer.invoke('login', d),
  logout:         ()   => ipcRenderer.invoke('logout'),
  getConfig:      ()   => ipcRenderer.invoke('get-config'),
  saveConfig:     (c)  => ipcRenderer.invoke('save-config', c),
  getProductos:   (f)  => ipcRenderer.invoke('get-productos', f),
  saveProducto:   (p)  => ipcRenderer.invoke('save-producto', p),
  deleteProducto: (id) => ipcRenderer.invoke('delete-producto', id),
  getCategorias:  ()   => ipcRenderer.invoke('get-categorias'),
  nuevaVenta:     (v)  => ipcRenderer.invoke('nueva-venta', v),
  getVentas:      (f)  => ipcRenderer.invoke('get-ventas', f),
  getVentaDetalle:(id) => ipcRenderer.invoke('get-venta-detalle', id),
  revertirVenta:  (d)  => ipcRenderer.invoke('revertir-venta', d),
  hacerCierre:    (d)  => ipcRenderer.invoke('hacer-cierre', d),
  getCierres:     ()   => ipcRenderer.invoke('get-cierres'),
  getUsuarios:    ()   => ipcRenderer.invoke('get-usuarios'),
  saveUsuario:    (u)  => ipcRenderer.invoke('save-usuario', u),
  getDashboard:   ()   => ipcRenderer.invoke('get-dashboard'),
  getReporte:     (f)  => ipcRenderer.invoke('get-reporte', f),
  printTicket:    (h)  => ipcRenderer.invoke('print-ticket', h),
  getAuditLog:      (f)  => ipcRenderer.invoke('get-audit-log', f),
  // Clientes
  getClientes:      (b)  => ipcRenderer.invoke('get-clientes', b),
  saveCliente:      (c)  => ipcRenderer.invoke('save-cliente', c),
  deleteCliente:    (id) => ipcRenderer.invoke('delete-cliente', id),
  getClienteHistorial:(n)=> ipcRenderer.invoke('get-cliente-historial', n),
  // Apertura de caja
  getAperturaActiva:()   => ipcRenderer.invoke('get-apertura-activa'),
  abrirCaja:        (d)  => ipcRenderer.invoke('abrir-caja', d),
  cerrarApertura:   (d)  => ipcRenderer.invoke('cerrar-apertura', d),
  // Kardex
  getKardex:        (id) => ipcRenderer.invoke('get-kardex', id),
  ajusteInventario: (d)  => ipcRenderer.invoke('ajuste-inventario', d),
  // Devoluciones
  getDevoluciones:  ()   => ipcRenderer.invoke('get-devoluciones'),
  nuevaDevolucion:  (d)  => ipcRenderer.invoke('nueva-devolucion', d),
  // Proveedores
  getProveedores:   (b)  => ipcRenderer.invoke('get-proveedores', b),
  saveProveedor:    (p)  => ipcRenderer.invoke('save-proveedor', p),
  deleteProveedor:  (id) => ipcRenderer.invoke('delete-proveedor', id),
  // Compras
  getCompras:       ()   => ipcRenderer.invoke('get-compras'),
  nuevaCompra:      (c)  => ipcRenderer.invoke('nueva-compra', c),
  // Descuentos
  getDescuentos:    ()   => ipcRenderer.invoke('get-descuentos'),
  saveDescuento:    (d)  => ipcRenderer.invoke('save-descuento', d),
  deleteDescuento:  (id) => ipcRenderer.invoke('delete-descuento', id),
  validarDescuento: (d)  => ipcRenderer.invoke('validar-descuento', d),
  usarDescuento:    (c)  => ipcRenderer.invoke('usar-descuento', c),
  // Backup
  hacerBackup:      ()   => ipcRenderer.invoke('hacer-backup'),
  restaurarBackup:  ()   => ipcRenderer.invoke('restaurar-backup'),
  getBackupsList:   ()   => ipcRenderer.invoke('get-backups-list'),
});
