# RESPONSIBILITY_MATRIX.md - MATRIZ DE ASIGNACIÓN DE RESPONSABILIDADES V2

Este documento redistribuye el código monolítico actual entre las 17 capas oficiales de la Arquitectura V2.

| Capa V2 | Archivo Destino V2 | Responsabilidad Extraída del Código Legacy |
| :--- | :--- | :--- |
| **View** | `views/DescuentosView.tsx` | Renderizado del título, botón de nuevo código, modal y JSX. |
| **Component** | `components/DescuentoFormModal.tsx` | Componente aislado de diálogo para creación/edición de descuentos. |
| **Component** | `components/DescuentosTabla.tsx` | Componente reutilizable de renderizado de la tabla usando `src/ui/tables/Table.tsx`. |
| **ViewModel / Hook**| `hooks/useDescuentos.ts` | Estado `descuentos`, `showModal`, `loading`, funciones `load()`, `save()`, `del()`. |
| **Logic** | `logic/validarDescuento.ts` | Evaluación pura de vigencia, mínimo de compra, límite de usos y cálculo de porcentaje. |
| **Service** | `services/descuentosService.ts` | Llamadas `fetchClient.get()`, `post()`, `delete()` a la API de descuentos. |
| **Repository** | `repositories/descuentosRepository.ts` | Consultas directas a Prisma (`findMany`, `create`, `update`, `findUnique`). |
| **Mapper** | `mappers/descuentoMapper.ts` | Transformación bidireccional entre `Descuento` Prisma, Entity y DTO. |
| **DTO** | `dto/DescuentoDTO.ts` | Tipado estricto `DescuentoResponseDTO`, `CrearDescuentoDTO`, `ValidarDescuentoDTO`. |
| **Validator** | `validators/descuentoValidator.ts` | Esquema Zod de validación de entrada (`codigo`, `valor`, `minimoCompra`). |
| **Types** | `types/index.ts` | Tipos TypeScript locales del módulo. |
| **API Handler** | `api/descuentoHandler.ts` | Controlador central de rutas de API. |
| **Permissions** | `permissions/index.ts` | Regla de autorización del módulo (`rol === 'admin'`). |
