# MÓDULO DESCUENTOS - GOLDEN MODULE (ARQUITECTURA V2)

- **Nombre del Módulo**: `Descuentos`
- **Ubicación**: [`src/modules/descuentos/`](file:///c:/Users/Tecnico%20WS/Desktop/WebSoft_POS/Websoft_pos_web-main/src/modules/descuentos)
- **Estado**: **CERTIFIED - GOLDEN MODULE**
- **Arquitectura**: Arquitectura V2 (Vertical Slice Monolito Modular)

---

## 1. DESCRIPCIÓN GENERAL
El módulo **Descuentos** gestiona la creación, parametrización, listado, deshabilitación y validación de cupones/códigos de descuento para las ventas del ERP y el módulo de Punto de Venta (POS).

---

## 2. OBJETIVO DEL MÓDULO
Proporcionar un dominio desacoplado de promociones que evalúe la validez de un cupón (vigencia por fechas, montos mínimos de compra y límites de usos) y retorne el porcentaje/monto de rebaja aplicable sin depender directamente de componentes de interfaz ni exponer la infraestructura de persistencia.

---

## 3. ARQUITECTURA Y CAPAS DE DOMINIO

```text
src/modules/descuentos/
├── dto/                    # Data Transfer Objects (Request/Response/Validación)
├── types/                  # Interfaces e identificadores de dominio local
├── constants/              # Mensajes, defaults y enums del módulo
├── validators/             # Esquemas de validación Zod
├── mappers/                # Transformadores bidireccionales (Prisma -> DTO -> UI)
├── repositories/           # Capa de persistencia exclusiva con Prisma ORM
├── logic/                  # Reglas de negocio puras y casos de uso
├── services/               # Cliente de aplicación con fetchClient
├── hooks/                  # Hook único de orquestación de estado (useDescuentos)
├── components/             # Componentes visuales atómicos reutilizables
├── views/                  # Vista ensambladora principal (DescuentosView)
└── index.ts                # Public API / Barrel exportador del módulo
```

---

## 4. FLUJO PRINCIPAL DE INTEGRACIÓN
1. **App Router Server Component (`src/app/(dashboard)/descuentos/page.tsx`)**: Renderiza exclusivamente `<DescuentosView />`.
2. **Presentación (`DescuentosView.tsx`)**: Orquesta el uso de `<DescuentoToolbar />`, `<DescuentosTabla />` y `<DescuentoFormModal />` a través de `useDescuentos()`.
3. **Estado y Orquestación (`useDescuentos.ts`)**: Consume `descuentosService` para coordinar peticiones asíncronas HTTP.
4. **Adaptadores HTTP App Router (`src/app/api/descuentos/`)**: Invocan `descuentosRepository` y `validarDescuentoRules`.
5. **Persistencia (`descuentosRepository.ts`)**: Interactúa exclusivamente con Prisma client.

---

## 5. CÓMO EXTENDER ESTE MÓDULO
- **Nueva Regla de Negocio**: Adicionar la función pura en `logic/validarDescuento.ts` o `logic/descuentosLogic.ts`.
- **Nuevo Campo de Cupón**:
  1. Actualizar Prisma Schema (migración).
  2. Actualizar DTOs en `dto/DescuentoDTO.ts`.
  3. Actualizar `descuentoValidator.ts` y `descuentoMapper.ts`.
  4. Actualizar `DescuentoForm.tsx` y `DescuentosTabla.tsx`.
