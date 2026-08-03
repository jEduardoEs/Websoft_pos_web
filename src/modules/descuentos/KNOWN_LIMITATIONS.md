# KNOWN_LIMITATIONS.md - EVALUACIÓN DE LIMITACIONES Y DEUDA TÉCNICA

- **Módulo**: `Descuentos`

---

## 1. ESTADO DE DEUDA TÉCNICA
- **Deuda Técnica en el Módulo V2**: **0%**.
- **Acceso a Prisma**: Directo desde el Repositorio de la V2.
- **Formateo e Insumos**: Sanitizados al 100% mediante esquemas Zod.

---

## 2. LIMITACIONES CONOCIDAS DEL DOMINIO LEGACY
- **Tipos de Descuento Soportados**: Actualmente el modelo soporta tipos `porcentaje` y `fijo`.
- **Soft Delete**: Los cupones eliminados cambian su estado a `activo: false` para conservar trazabilidad de ventas históricas en el POS.
