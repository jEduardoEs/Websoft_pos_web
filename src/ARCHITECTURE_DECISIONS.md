# REGISTRO OFICIAL DE DECISIONES ARQUITECTÓNICAS (ADR) - ARQUITECTURA V2

---

## ADR-001: Adopción del Patrón Monolito Modular (Modular Monolith)
- **Fecha**: 3 de agosto de 2026
- **Estatus**: Aceptado
- **Motivo**: El sistema ERP/POS original concentraba la lógica de negocio directamente en las páginas cliente de React (Smart UI). Para escalar el sistema sin incurrir en la complejidad operativa de microservicios, se adopta un Monolito Modular.
- **Impacto**: Cada capacidad del ERP (ej. Ventas, Inventario, Contabilidad) se aísla en `src/modules/[modulo]/` con fronteras estrictas.
- **Alternativas Descartadas**:
  - *Microservicios*: Descartado por costos de infraestructura, latencia inter-servicio y complejidad de despliegue innecesaria para la etapa actual.
  - *Monolito Tradicional Capas Globales*: Descartado porque perpetuaba el acoplamiento cruzado entre tablas y vistas.

---

## ADR-002: Separación Estricta en 17 Capas por Módulo (Clean Architecture)
- **Fecha**: 3 de agosto de 2026
- **Estatus**: Aceptado
- **Motivo**: Garantizar que el 100% de la lógica de negocio (`logic/`) pueda probarse de forma unitaria en milisegundos sin requerir interfaz gráfica viva ni conexión a PostgreSQL.
- **Impacto**: Se define la plantilla oficial `src/modules/__template/` con 17 capas privadas (`api`, `repositories`, `mappers`, `dto`, `adapters`, `state`, `permissions`, `constants`, `tests`, `components`, `views`, `logic`, `hooks`, `services`, `validators`, `types`, `utils`).
- **Alternativas Descartadas**:
  - *Estructura React Básica (components/pages)*: Descartada por permitir fuga de lógica de negocio hacia el JSX.

---

## ADR-003: Prohibición de Acceso Directo de la UI a Prisma y `fetch()` Directo
- **Fecha**: 3 de agosto de 2026
- **Estatus**: Aceptado
- **Motivo**: Prevenir el acoplamiento directo entre los componentes de renderizado de React y la capa de persistencia o los endpoints HTTP.
- **Impacto**: Las vistas (`views/`) consumen la capa de aplicación (`services/`) única y exclusivamente a través de ViewModels y Custom Hooks (`hooks/`).
- **Alternativas Descartadas**:
  - *Llamadas `fetch()` inline en `useEffect`*: Descartado por duplicación de código de carga y manejo de errores inconsistente.

---

## ADR-004: Implementación de Contenedor IoC / Inyección de Dependencias
- **Fecha**: 3 de agosto de 2026
- **Estatus**: Aceptado
- **Motivo**: Permitir la sustitución de implementaciones concretas por Mocks durante las pruebas unitarias e integradas.
- **Impacto**: Se crea `src/core/container/Container.ts` y `ServiceRegistry.ts` para registrar y resolver dependencias del ERP.
- **Alternativas Descartadas**:
  - *Importación directa de instancias Singleton*: Descartado por acoplamiento rígido que dificulta el testing aislado.

---

## ADR-005: Event Bus de Dominio en Memoria
- **Fecha**: 3 de agosto de 2026
- **Estatus**: Aceptado
- **Motivo**: Permitir la comunicación asíncrona y desacoplada entre módulos (ej. al completar una Venta, notificar a Inventario y Contabilidad sin importar sus archivos privados).
- **Impacto**: Se crea `src/core/events/EventBus.ts` para suscripción y publicación de eventos de dominio (`IDomainEvent`).
- **Alternativas Descartadas**:
  - *Invocación directa entre módulos*: Descartado por generar dependencias circulares entre módulos del negocio.
