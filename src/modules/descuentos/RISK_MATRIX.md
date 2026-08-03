# RISK_MATRIX.md - MATRIZ DE RIESGOS MATEMÁTICA Y MITIGACIÓN

| Riesgo | Descripción | Impacto | Probabilidad | Estrategia de Mitigación V2 |
| :--- | :--- | :--- | :--- | :--- |
| **R-01** | Tipo de error preexistente en `prisma.findUnique({ where: { activo: true } })` | **Alta** | **Alta (100%)** | Corregir la consulta en `descuentosRepository.ts` filtrando `activo` después del `findUnique` o usando `findFirst`. |
| **R-02** | Formato inconsistente de fechas (`Date` vs `ISO String`) | **Media** | **Media** | Formateo estandarizado mediante `src/shared/dates` (`formatDate`). |
| **R-03** | Modificación involuntaria del payload retornado al POS (`/api/descuentos/validar`) | **Alta** | **Baja** | Mantenimiento del contrato de respuesta `{ ok: true, porcentaje, descuento }`. |
