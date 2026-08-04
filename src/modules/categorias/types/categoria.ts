// src/modules/categorias/types/categoria.ts

export interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string;
  activo?: boolean;
  createdAt?: Date;
}
