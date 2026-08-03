# RISK_ANALYSIS.md - ANÁLISIS DE RIESGOS Y PLAN DE ROLLBACK

---

## 1. RIESGOS IDENTIFICADOS EN EL CÓDIGO LEGACY

### Riesgo R-01: Error de Tipos Preexistente en `validar/route.ts`
- **Descripción**: En la línea 14 de `src/app/api/descuentos/validar/route.ts`, se ejecuta `prisma.descuento.findUnique({ where: { codigo: codigo.toUpperCase(), activo: true } })`. En la definición del tipo `DescuentoWhereUniqueInput` de Prisma Client, la propiedad `activo` no forma parte de la clave única (únicamente `id` y `codigo`).
- **Mitigación V2**: En `descuentosRepository.ts`, la consulta se estructurará correctamente separando la clave única de la condición de filtro:
  ```ts
  const d = await prisma.descuento.findUnique({ where: { codigo: codigo.toUpperCase() } })
  if (!d || !d.activo) return null
  ```

### Riesgo R-02: Interrupción de la API de Validación Utilizada por el POS
- **Descripción**: El módulo de POS realiza peticiones `POST /api/descuentos/validar`. Si la estructura de la respuesta JSON cambia, se rompería el cálculo de descuentos en el POS.
- **Mitigación V2**: Se garantizará la compatibilidad 100% manteniendo en el DTO de respuesta las propiedades exactas `{ ok: true, porcentaje, descuento }`.

---

## 2. PLAN DE ROLLBACK
1. La migración se mantendrá en una rama aislada de Git hasta superar el 100% de los tests unitarios.
2. Si ocurriera algún imprevisto durante el despliegue del módulo V2, la ruta de App Router `src/app/(dashboard)/descuentos/page.tsx` puede ser revertida a la implementación original sin afectar la base de datos PostgreSQL.
