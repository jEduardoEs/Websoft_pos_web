# ESTÁNDARES DE API REST Y DTOs EN LA ARQUITECTURA V2

---

## 1. FORMATO ESTÁNDAR DE RESPUESTA EXITOSA (`ApiResponseDTO<T>`)
Toda respuesta HTTP exitosa emitida por los endpoints del ERP debe retornar el siguiente formato JSON estandarizado:

```json
{
  "ok": true,
  "status": 200,
  "data": {
    "id": 101,
    "numero": "V-00101",
    "total": 150.00
  },
  "message": "Operación realizada exitosamente"
}
```

---

## 2. FORMATO ESTÁNDAR DE RESPUESTA DE ERROR (`ApiErrorResponse`)
Toda respuesta de error debe capturarse y retornar un código HTTP adecuado junto con detalles estructurados:

```json
{
  "ok": false,
  "status": 400,
  "error": "El total de la venta no coincide con la suma de los ítems",
  "code": "VALIDATION_ERROR",
  "details": [
    { "field": "total", "message": "Monto inconsistente" }
  ]
}
```

---

## 3. CÓDIGOS DE ESTADO HTTP UTILIZADOS
- **`200 OK`**: Petición de lectura o actualización procesada exitosamente.
- **`201 Created`**: Recurso creado exitosamente (ej. venta o producto registrado).
- **`400 Bad Request`**: Datos de entrada inválidos o faltantes (fallo de esquema Zod).
- **`401 Unauthorized`**: Usuario sin sesión activa de NextAuth.
- **`403 Forbidden`**: Usuario autenticado pero sin permiso en el módulo (`tienePermiso === false`).
- **`404 Not Found`**: Recurso no existente en PostgreSQL.
- **`409 Conflict`**: Conflicto de unicidad (ej. código de producto o NIT ya existente).
- **`422 Unprocessable Entity`**: Violación de regla de negocio del ERP (ej. stock insuficiente).
- **`500 Internal Server Error`**: Error no controlado en la infraestructura.

---

## 4. VALIDACIÓN DE ENTRADA CON ZOD
Todo endpoint de la API debe utilizar los esquemas de validación de `validators/` antes de procesar cualquier transacción de negocio:

```ts
// Ejemplo en API Handler
const validation = ventaSchema.safeParse(body)
if (!validation.success) {
  throw new ValidationError('Datos de entrada inválidos', validation.error.errors)
}
```
