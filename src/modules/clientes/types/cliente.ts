// src/modules/clientes/types/cliente.ts

export interface Cliente {
  id: number;
  nombre: string;
  nit?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  notas?: string;
  activo: boolean;
  creadoEn?: Date;
}
