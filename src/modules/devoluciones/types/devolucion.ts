export interface Devolucion {
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
  items?: DevolucionItem[];
}

export interface DevolucionItem {
  id?: number;
  devolucionId?: number;
  productoId?: number;
  codigo: string | null;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  totalItem: number;
}
