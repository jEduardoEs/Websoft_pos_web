// src/modules/categorias/dto/create-categoria.dto.ts

export interface CreateCategoriaDto {
  nombre: string;
  descripcion?: string;
  activo?: boolean;
}
