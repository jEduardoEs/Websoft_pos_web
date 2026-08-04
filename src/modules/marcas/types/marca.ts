// src/modules/marcas/types/marca.ts

export interface Marca {
  id: number;
  nombre: string;
  descripcion?: string;
  activo?: boolean;
  createdAt?: Date;
}
