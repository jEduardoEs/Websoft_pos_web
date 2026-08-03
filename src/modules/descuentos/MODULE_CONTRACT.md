# MODULE_CONTRACT.md - CONTRATO INMUTABLE DEL MÓDULO "DESCUENTOS"

Este documento especifica la **API pública** y los contratos inmutables que el módulo `Descuentos` expondrá a través de `src/modules/descuentos/index.ts`.

---

## 1. DTOs PÚBLICOS EXPORTADOS
```ts
export interface DescuentoDTO {
  id: number
  codigo: string
  descripcion: string | null
  tipo: 'porcentaje' | 'fijo'
  valor: number
  minimoCompra: number
  usosMaximos: number
  usosActuales: number
  fechaInicio: string | null
  fechaFin: string | null
  activo: boolean
}

export interface ValidacionDescuentoResultDTO {
  ok: boolean
  porcentaje?: number
  descuento?: DescuentoDTO
  error?: string
}
```

---

## 2. SERVICIOS Y FUNCIONES PÚBLICAS EXPORTADAS
- `descuentosService.obtenerTodos()`: Retorna `Promise<DescuentoDTO[]>`.
- `descuentosService.validarCodigo(codigo: string, total: number)`: Retorna `Promise<ValidacionDescuentoResultDTO>`.
- `DescuentosView`: Componente de presentación principal del módulo.
