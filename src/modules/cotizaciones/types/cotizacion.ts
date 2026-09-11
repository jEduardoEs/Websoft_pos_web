export interface Cotizacion {
  id: number;
  numero: string;
  fecha: string | Date;
  clienteNombre: string;
  clienteDireccion: string | null;
  clienteTelefono: string | null;
  clienteNit: string | null;
  atencion: string | null;
  formaPago: string | null;
  descripcion: string | null;
  notas: string | null;
  subtotal: number;
  descuento: number;
  total: number;
  estado: string;
  validezDias: number;
  usuarioId: number | null;
  usuarioNombre: string | null;
  tiempoInstalacion: string | null;
  createdAt: string | Date;
  items?: CotizacionItem[];
}

export interface CotizacionItem {
  id?: number;
  cotizacionId?: number;
  codigo: string | null;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  descuento: number;
  totalItem: number;
}

// Frontend Line Item (includes UI specific fields like zonaId, tipo)
export interface LineItem {
  tipo: 'producto' | 'servicio' | 'instalacion';
  productoId: number | null;
  codigo: string;
  descripcion: string;
  costoCompra: number;
  precioVenta: number;
  cantidad: number;
  descuento: number;
  subtotal: number;
  total: number;
  zonaId: number | null;
  zonaNombre: string;
  zonaTarifa: number;
  cargoAdicional: number;
  notaAdicional: string;
}
