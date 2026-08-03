# PROTOCOLO CENTRAL DE MANEJO DE ERRORES EN LA ARQUITECTURA V2

Este documento establece la jerarquía oficial de excepciones y el flujo de captura de errores en el ERP/POS.

---

## 1. JERARQUÍA OFICIAL DE ERRORES (`src/core/errors/`)

```
                        [ Error (Native JS) ]
                                  │
                                  ▼
                         [ AppError (Base) ]
                                  │
      ┌───────────────────────────┼───────────────────────────┐
      ▼                           ▼                           ▼
[ ValidationError ]     [ BusinessError ]           [ UnauthorizedError ]
   (Status 400)            (Status 422)                (Status 401)
      │                           │                           │
      ▼                           ▼                           ▼
[ ConflictError ]       [ NotFoundError ]           [ UnexpectedError ]
   (Status 409)            (Status 404)                (Status 500)
```

---

## 2. DESCRIPCIÓN DE EXCEPCIONES

1. **`AppError`**: Clase base abstracta. Hereda de `Error`, contiene `statusCode`, `code` y `details`.
2. **`ValidationError`** (400): Invocado cuando un insumo no cumple el esquema Zod de `validators/`.
3. **`BusinessError`** (422): Invocado cuando se viola una regla del ERP (ej. apertura de caja requerida antes de vender).
4. **`UnauthorizedError`** (401): Invocado por fallo de sesión de NextAuth o permisos de rol insuficientes.
5. **`ConflictError`** (409): Invocado al intentar insertar duplicados en campos únicos (NIT, código de producto).
6. **`NotFoundError`** (404): Invocado cuando un ID solicitado no existe en PostgreSQL.
7. **`UnexpectedError`** (500): Captura de fallos no controlados de sistema.

---

## 3. FLUJO DE CAPTURA DE ERRORES
1. **Dominio (`logic/`)**: Lanza `BusinessError` o `ValidationError`.
2. **Persistencia (`repositories/`)**: Captura errores de base de datos y los traduce a `NotFoundError` o `ConflictError`.
3. **API Handler (`src/app/api/`)**: Envoltorio `try/catch` central que convierte cualquier `AppError` en una respuesta `NextResponse.json({ ok: false, error: ... }, { status: error.statusCode })`.
