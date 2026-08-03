# TESTING_GUIDE.md - ESTRATEGIA Y GUÍA DE PRUEBAS DEL ERP V2

## 1. TIPOS DE PRUEBAS Y UBICACIÓN
- **Unitarias (`src/tests/unit/` o `src/modules/[modulo]/tests/unit/`)**: Prueban casos de uso en `logic/`, `mappers/` y `validators/` de forma aislada sin base de datos ni UI.
- **Integración (`src/tests/integration/`)**: Prueban repositorios (`repositories/`) e integraciones con Prisma Mocks o base de datos de pruebas.
- **E2E (`src/tests/e2e/`)**: Prueban flujos completos de usuario (POS, Ventas, Cotizaciones).
- **Mocks (`src/tests/mocks/`)**: Datos mock estandarizados (MockUsers, MockVentas, MockProductos).

## 2. REGLA DE ORO DE TESTABILIDAD
Gracias al desacoplamiento de Clean Architecture en 17 capas, el 100% de la lógica de negocio (`logic/`) puede probarse de forma unitaria en milisegundos mediante funciones puras sin necesidad de levantar el servidor de Next.js.
