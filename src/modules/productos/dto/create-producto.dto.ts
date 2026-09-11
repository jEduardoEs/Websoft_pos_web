// src/modules/productos/dto/create-producto.dto.ts

export class CreateProductoDto {
  codigo?: string;
  nombre!: string;
  descripcion?: string;
  precio!: number;
  costo?: number;
  stock?: number;
  stockMinimo?: number;
  categoria?: string;
  categoriaId?: string; // fallback for legacy
  unidad?: string;
  activo?: boolean;
  imagenUrl?: string;
}
