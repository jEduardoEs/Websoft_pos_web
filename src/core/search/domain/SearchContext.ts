export enum SearchContextType {
  GLOBAL = 'GLOBAL',
  COTIZACION = 'COTIZACION',
  VENTA = 'VENTA',
  INVENTARIO = 'INVENTARIO',
  GARANTIA = 'GARANTIA',
  PROYECTO = 'PROYECTO',
}

export interface SearchContextRules {
  allowZeroStock: boolean;
  prioritizeInStock: boolean;
  defaultOnlyActive: boolean;
}

export class SearchContextManager {
  static getRules(context?: string): SearchContextRules {
    const ctx = (context || SearchContextType.GLOBAL).toUpperCase();
    switch (ctx) {
      case SearchContextType.COTIZACION:
        return {
          allowZeroStock: true,
          prioritizeInStock: false,
          defaultOnlyActive: true,
        };
      case SearchContextType.VENTA:
        return {
          allowZeroStock: true,
          prioritizeInStock: true,
          defaultOnlyActive: true,
        };
      case SearchContextType.INVENTARIO:
        return {
          allowZeroStock: true,
          prioritizeInStock: false,
          defaultOnlyActive: false,
        };
      case SearchContextType.GARANTIA:
      case SearchContextType.PROYECTO:
      case SearchContextType.GLOBAL:
      default:
        return {
          allowZeroStock: true,
          prioritizeInStock: false,
          defaultOnlyActive: true,
        };
    }
  }
}
