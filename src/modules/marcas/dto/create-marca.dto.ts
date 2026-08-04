// src/modules/marcas/dto/create-marca.dto.ts

export interface CreateMarcaDto {
  nombre: string;
  descripcion?: string;
  activo?: boolean;
}
