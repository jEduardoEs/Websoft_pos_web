# PUBLIC_API.md - ESPECIFICACIÓN DE CONTRATOS PÚBLICOS Y BARREL

- **Módulo**: `Descuentos`
- **Ubicación del Barrel**: [`src/modules/descuentos/index.ts`](file:///c:/Users/Tecnico%20WS/Desktop/WebSoft_POS/Websoft_pos_web-main/src/modules/descuentos/index.ts)

---

## 1. EXPORTACIONES PÚBLICAS PERMITIDAS

```typescript
// DTOs
export type {
  DescuentoResponseDTO,
  CreateDescuentoDTO,
  UpdateDescuentoDTO,
  DeleteDescuentoDTO,
  ValidateDescuentoDTO,
  ValidarDescuentoResponseDTO,
} from './dto/DescuentoDTO'

// Componentes y Vistas
export { DescuentosView } from './views/DescuentosView'
export { DescuentoToolbar } from './components/DescuentoToolbar'
export { DescuentosTabla } from './components/DescuentosTabla'
export { DescuentoForm } from './components/DescuentoForm'
export { DescuentoFormModal } from './components/DescuentoFormModal'

// Hooks
export { useDescuentos } from './hooks/useDescuentos'

// Servicios y Lógica
export { descuentosService } from './services/descuentosService'
export { descuentosRepository } from './repositories/descuentosRepository'
export { validarDescuentoRules } from './logic/validarDescuento'
export { DescuentosLogic } from './logic/descuentosLogic'
```

---

## 2. ENDPOINTS CONSUMIDOS Y CONTRATOS INVIOLABLES
- `GET /api/descuentos`: Retorna lista de `DescuentoResponseDTO[]`.
- `POST /api/descuentos`: Recibe `CrearDescuentoDTO` y retorna el cupón actualizado/creado.
- `DELETE /api/descuentos?id={id}`: Ejecuta soft delete del descuento.
- `POST /api/descuentos/validar`: Recibe `{ codigo, total }` y retorna `ValidarDescuentoResponseDTO`. Consumido por la pantalla POS.
