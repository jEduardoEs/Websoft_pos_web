export interface CompraItemDto {
  productoId?: number;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
}

export class CreateCompraDto {
  proveedorId?: number;
  fecha?: string;
  numeroFactura?: string;
  serieFactura?: string;
  facturaUrl?: string;
  notas?: string;
  items!: CompraItemDto[];
}
