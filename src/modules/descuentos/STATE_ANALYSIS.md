# STATE_ANALYSIS.md - CLASIFICACIÓN Y ANÁLISIS DE ESTADO EN "DESCUENTOS"

---

## 1. UI STATE (ESTADO VISUAL EFÍMERO)
- `showModal`: Booleano que controla la visibilidad del modal.
- `loading`: Booleano que deshabilita el botón durante peticiones en vuelo.

---

## 2. BUSINESS STATE (ESTADO DE NEGOCIO / FORMULARIO)
- `form`: Estado reactivo del formulario (`id`, `codigo`, `descripcion`, `tipo`, `valor`, `minimoCompra`, `usosMaximos`, `fechaInicio`, `fechaFin`).

---

## 3. SERVER STATE (ESTADO DEL SERVIDOR)
- `descuentos`: Arreglo `Descuento[]` sincronizado con PostgreSQL vía `fetch('/api/descuentos')`.

---

## 4. DERIVED STATE (ESTADO DERIVADO / CÁLCULOS)
- `porcentajeEquivalente`: Si el tipo es `fijo`, se calcula dinámicamente como `(d.valor / total * 100)`.
- `usosFormateados`: Renderizado textual `usosActuales / (usosMaximos === 0 ? '∞' : usosMaximos)`.
- `vigenciaFormateada`: Renderizado condicional `fmtDate(fechaInicio) - fmtDate(fechaFin)` o `'Sin límite'`.
