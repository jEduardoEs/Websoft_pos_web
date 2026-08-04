// src/modules/productos/dto/update-producto.dto.ts

export class UpdateProductoDto {
  codigo?: string;
  nombre?: string;
  descripcion?: string;
  precio?: number;
  costo?: number;
  stock?: number;
  stockMinimo?: number;
  categoria?: string;
  categoriaId?: string; // fallback
  unidad?: string;
  activo?: boolean;
  imagenUrl?: string;
}
