# TEST_PLAN.md - PLAN MAESTRO DE PRUEBAS DEL MÓDULO DESCUENTOS

---

## 1. CASOS PRUEBA DE REGLAS DE NEGOCIO (`logic/validarDescuento.ts`)
- **TC-01**: Cupón inactivo debe retornar `{ ok: false, error: 'Código no válido' }`.
- **TC-02**: Cupón fuera de fecha de inicio debe retornar error de no vigencia.
- **TC-03**: Cupón con fecha expirada debe retornar error de vencimiento.
- **TC-04**: Venta con importe inferior al mínimo de compra debe rechazar la aplicación.
- **TC-05**: Cupón con usos agotados (`usosActuales >= usosMaximos`) debe retornar error de cuota superada.
- **TC-06**: Cupón válido debe calcular correctamente el porcentaje o monto equivalente.

---

## 2. CASOS PRUEBA DE INTEGRACIÓN Y HTTP (`services/descuentosService.ts`)
- **TC-07**: `obtenerTodos()` debe llamar a `GET /api/descuentos` y mapear la respuesta en DTOs.
- **TC-08**: `guardar()` debe enviar el payload sanitizado por Zod a `POST /api/descuentos`.
- **TC-09**: `desactivar()` debe enviar `DELETE /api/descuentos?id=X`.

---

## 3. CASOS PRUEBA DE INTERFAZ (`views/DescuentosView.tsx`)
- **TC-10**: Carga inicial debe mostrar la tabla con los cupones activos.
- **TC-11**: Clic en `+ Nuevo Código` abre el modal `DescuentoFormModal`.
- **TC-12**: Envío de formulario válido invoca `save()` y cierra el modal mostrando toast de éxito.
