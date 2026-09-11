export interface VentaItem {
  id: number;
  ventaId: number;
  productoId: number | null;
  codigo: string | null;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  subtotal: number;
}

export interface Venta {
  id: number;
  numero: string;
  fecha: string | Date;
  clienteNombre: string;
  clienteNit: string;
  subtotal: number;
  descuento: number;
  impuesto: number;
  total: number;
  metodoPago: string;
  montoRecibido: number;
  cambio: number;
  estado: string;
  notas: string | null;
  usuarioId: number | null;
  usuarioNombre: string | null;
  
  // FEL (Factura Electronica en Linea)
  felUuid: string | null;
  felSerie: string | null;
  felNumero: number | null;
  felCertificacion: string | null;
  felPdfUrl: string | null;
  felEstado: string | null;

  items?: VentaItem[];
}
