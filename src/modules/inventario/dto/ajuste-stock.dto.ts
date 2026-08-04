// src/modules/inventario/dto/ajuste-stock.dto.ts

export class AjusteStockDto {
  productoId!: number;
  cantidad!: number;
  tipo!: 'entrada' | 'salida';
  motivo?: string;
}
