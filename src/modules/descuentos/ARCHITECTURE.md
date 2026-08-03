# DESGLOSE DE ARQUITECTURA - MÓDULO DESCUENTOS

- **Estatus**: **GOLDEN MODULE SPECIFICATION**

---

## 1. DESGLOSE DE CAPAS Y RESPONSABILIDADES

### 1. Capa de Vista (`views/DescuentosView.tsx`)
- Presentación pura sin estado interno ni lógica de negocio.
- Renderiza la combinación de `<DescuentoToolbar />`, `<DescuentosTabla />` y `<DescuentoFormModal />`.

### 2. Capa de Componentes Atómicos (`components/`)
- `DescuentoToolbar.tsx`: Encabezado y acciones principales.
- `DescuentosTabla.tsx`: Renderizado estandarizado de filas y celdas.
- `DescuentoForm.tsx`: Formulario aislado desacoplado de diálogos.
- `DescuentoFormModal.tsx`: Diálogo modal compuesto.
- `DescuentoEmptyState.tsx`: Renderizado de lista vacía.
- `DescuentoLoadingState.tsx`: Indicador esquelético de carga.
- `DescuentoConfirmDeleteDialog.tsx`: Diálogo de confirmación de deshabilitación.

### 3. Capa de Hook Orquestador (`hooks/useDescuentos.ts`)
- Mantiene el 100% de `useState`, `useEffect` y manejo de notificaciones `toast`.
- Expone los métodos `openNew()`, `closeModal()`, `save()`, `del()`.

### 4. Capa de Lógica de Negocio Pura (`logic/`)
- `validarDescuento.ts`: Reglas de validez del cupón (fechas, mínimo de compra, usos).
- `descuentosLogic.ts`: Transformaciones de formularios y formateo de etiquetas.

### 5. Capa de Servicios de Aplicación (`services/descuentosService.ts`)
- Cliente HTTP que ejecuta comunicaciones asíncronas vía `fetchClient`.

### 6. Capa de Repositorio (`repositories/descuentosRepository.ts`)
- Punto de acceso exclusivo a Prisma Client.

### 7. Capa de Mapeo (`mappers/descuentoMapper.ts`)
- Conversión desacoplada `Prisma -> DTO -> UI FormState`.

### 8. Capa de DTOs y Tipos (`dto/` y `types/`)
- DTOs fuertemente tipados para Request, Response y Validación.

---

## 2. FLUSO DE DATOS Y DIAGRAMA DE DIRECCIONALIDAD

```text
[ React UI View ] ──> [ useDescuentos Hook ] ──> [ descuentosService ]
         │                                              │
         ▼                                              ▼
[ Components ]                                  [ HTTP App Router API ]
                                                        │
                                                        ▼
                                           [ descuentosRepository ]
                                                        │
                                                        ▼
                                                  [ Prisma ORM ]
```
