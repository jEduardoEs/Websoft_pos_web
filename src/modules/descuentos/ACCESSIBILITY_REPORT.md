# ACCESSIBILITY_REPORT.md - REPORTE DE ACCESIBILIDAD (WCAG / ARIA)

- **Módulo**: `Descuentos` (`src/modules/descuentos/`)

---

## 1. COMPONENTES VISUALES Y ARIA
- **Modales (`DescuentoFormModal.tsx`)**: Utilizan superposición accesible con backdrop en `src/ui/dialogs/Modal.tsx` e incrustan botones de cierre accesibles.
- **Formularios (`DescuentoForm.tsx`)**: Los insumos de entrada se vinculan con sus correspondientes etiquetas `<label>` e indicadores de campo requerido (`*`).
- **Tablas (`DescuentosTabla.tsx`)**: Utilizan marcado semántico HTML5 (`<table>`, `<thead>`, `<tbody>`, `<th>`, `<td>`).

---

## 2. NAVEGACIÓN Y CONTRASTE
- Soporte de navegación por teclado en todos los botones e insumos interactivos.
- Cumplimiento de contraste de color mínimo según el Design System de `src/ui/`.
