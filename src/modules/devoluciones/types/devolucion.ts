export interface DevolucionItem {
  id?: number;
  devolucionId?: number;
  productoId?: number;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface Devolucion {
  id: number;
  fecha: string | Date;
  ventaId?: number | null;
  ventaNumero?: string | null;
  motivo: string;
  totalDevuelto: number;
  estado: string; // 'pendiente', 'aprobada', 'anulada', 'completada'
  usuarioId?: number | null;
  usuarioNombre?: string | null;
  items?: DevolucionItem[];
  // Relacion extra que traemos del backend para mostrar datos del cliente en la tabla
  venta?: {
    clienteNombre: string | null;
    clienteNit: string | null;
  } | null;
}
