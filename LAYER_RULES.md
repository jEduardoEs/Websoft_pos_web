# LAYER_RULES.md - REGLAS DE SEPARACIÓN DE CAPAS OFICIALES

Definición de las 9 capas del Framework V2:

1. **View**: Componentes visuales React (JSX). Renderizan información y capturan eventos. Prohibido hacer `fetch()`, usar Prisma o procesar lógica del ERP.
2. **ViewModel**: Adaptador de estado de presentación (`BaseViewModel`). Mantiene el estado legible de la vista sin acoplarse a la infraestructura.
3. **Logic**: Casos de uso de negocio (`IUseCase`). Funciones puras de TypeScript. Prohibido depender de React, DOM o frameworks HTTP.
4. **Service**: Clientes HTTP de la capa de aplicación (`IService`). Ejecutan peticiones asíncronas y manejan errores de red.
5. **Repository**: Capa de persistencia desacoplada (`IRepository`). Ejecuta consultas a Prisma ORM de forma aislada.
6. **Mapper**: Transformadores bidireccionales (`IMapper`). Convierten modelos de Prisma a Entidades de Dominio o DTOs.
7. **DTO**: Objetos planos de transferencia de datos de entrada/salida (`BaseDTO`).
8. **API**: Route Handlers de Next.js App Router (`src/app/api/`). Gestionan autenticación, permisos y delegan al Repository/Logic.
9. **Prisma**: ORM de acceso a la base de datos PostgreSQL (`@prisma/client`). Aislado dentro de `repositories/` o `src/core/database/`.
