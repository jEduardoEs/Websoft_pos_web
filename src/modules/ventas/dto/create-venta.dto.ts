export interface CreateVentaItemDto {
  productoId: number | null;
  codigo: string | null;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  subtotal: number;
  costo?: number;
  margin?: number;
  iva?: number;
  ganancia?: number;
}

export interface CreateVentaDto {
  clienteNombre?: string;
  clienteNit?: string;
  clienteCorreo?: string;
  subtotal: number;
  descuento: number;
  impuesto: number;
  total: number;
  metodoPago: string;
  montoRecibido: number;
  cambio: number;
  notas?: string;
  cotizacionId?: number;
  items: CreateVentaItemDto[];
}
