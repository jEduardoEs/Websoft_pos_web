// Centralized Inventory State Types for WebSoft POS
// Golden Rule: NO EMOJIS anywhere in code or comments.

export type InventoryItemStatus = 'disponible' | 'reservado' | 'entregado' | 'consumido' | 'devuelto';

export interface InventoryItemMovement {
  productoId: number;
  nombre?: string;
  cantidad: number;
}

export interface InventoryStateTransaction {
  id: string;
  productoId: number;
  cantidad: number;
  estadoAnterior: InventoryItemStatus;
  estadoNuevo: InventoryItemStatus;
  referencia: string;
  motivo: string;
  usuarioNombre: string;
  timestamp: Date;
}
