export type SearchEntity = 'PRODUCT' | 'CUSTOMER' | 'DOCUMENT' | 'PROJECT';

export interface SearchFilters {
  categoria?: string;
  soloActivos?: boolean;
  minPrecio?: number;
  maxPrecio?: number;
  [key: string]: any;
}

export interface SearchRequest {
  query: string;
  entity: SearchEntity;
  context?: string; // GLOBAL, COTIZACION, VENTA, INVENTARIO, GARANTIA, PROYECTO
  limit?: number;
  offset?: number;
  filters?: SearchFilters;
  includeCost?: boolean;
}
