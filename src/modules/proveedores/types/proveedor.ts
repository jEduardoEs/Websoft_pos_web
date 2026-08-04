export interface Proveedor {
  id: number;
  nombre: string;
  nit?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  contacto?: string;
  notas?: string;
  activo: boolean;
  creadoEn?: Date;
}
