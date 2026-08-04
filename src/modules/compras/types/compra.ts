export interface CompraItem {
  id: number;
  compraId: number;
  productoId?: number | null;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface Compra {
  id: number;
  numero: string;
  fecha: Date;
  proveedorId?: number | null;
  proveedorNombre?: string | null;
  proveedor?: { nombre: string } | null;
  subtotal: number;
  impuesto: number;
  total: number;
  estado: string;
  notas?: string | null;
  usuarioId?: number | null;
  usuarioNombre?: string | null;
  facturaUrl?: string | null;
  numeroFactura?: string | null;
  serieFactura?: string | null;
  items: CompraItem[];
}
