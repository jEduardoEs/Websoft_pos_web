# EXTRACTION_CANDIDATES.md - CANDIDATOS A EXTRACCIÓN Y REFACTORIZACIÓN

---

## 1. FUNCIONES PURAS MOVIPLES A `logic/`
- **`validarReglasDescuento(descuento, total)`**: Evaluación pura de vigencia (`now < fechaInicio`, `now > fechaFin`), mínimo de compra (`total < minimoCompra`) y límite de usos (`usosActuales >= usosMaximos`).
- **`calcularPorcentajeEquivalente(descuento, total)`**: Cálculo de porcentaje si el tipo es `fijo`.

---

## 2. ESQUEMAS Y DTOs A `validators/` Y `dto/`
- **`descuentoSchema`**: Esquema Zod de validación para `codigo`, `valor`, `minimoCompra`, `fechaInicio`, `fechaFin`.
- **`DescuentoResponseDTO`**: DTO fuertemente tipado para respuestas HTTP.

---

## 3. COMPONENTES REUTILIZABLES DE PRESENTACIÓN A `components/`
- **`DescuentoFormModal.tsx`**: Renderizado atómico del formulario dentro del modal.
- **`DescuentosTabla.tsx`**: Renderizado de tabla reutilizable apoyado en `src/ui/tables/Table.tsx`.
