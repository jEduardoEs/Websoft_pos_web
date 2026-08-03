# MODULE_ANALYSIS.md - AUDITORÍA E INGENIERÍA INVERSA DEL MÓDULO "ROLES"

---

## 1. INVENTARIO DE ARCHIVOS EXISTENTES
- **Página UI (Client Component)**: `src/app/(dashboard)/roles/page.tsx` (254 líneas).
- **Librería de Permisos**: `src/lib/permisos.ts` (`MODULOS`, `parsePermisos`).
- **Endpoint Configuración API**: `src/app/api/config/route.ts` (Lectura y guardado de `roles_personalizados`).
- **Endpoint Usuarios API**: `src/app/api/usuarios/route.ts` (Conteo de usuarios por rol).

---

## 2. ANÁLISIS DE ESTADO EN REACT (`roles/page.tsx`)
- `roles`: Lista de definiciones de roles (`RolDef[]`) inicializada con `ROLES_BASE`.
- `usuariosPorRol`: Diccionario `Record<string, number>` para conteo de usuarios asignados.
- `showModal`: Estado booleano de visibilidad del modal de gestión de roles.
- `form`: Estado del formulario (`RolDef`) inicializado en `emptyForm`.
- `editingId`: Identificador del rol en edición (`string | null`).
- `loading`: Estado booleano de persistencia.

---

## 3. ANÁLISIS DE REGLAS DE NEGOCIO IDENTIFICADAS
1. **Roles Base Inmutables**: Los 5 roles predefinidos (`admin`, `cajero`, `supervisor`, `contador`, `bodega`) poseen permisos por defecto y no pueden ser eliminados.
2. **Roles Personalizados (Custom Roles)**: Se persisten en la tabla de configuración global `Configuracion` dentro de la propiedad JSON `roles_personalizados`.
3. **Generación de Slug**: El ID de un nuevo rol se genera limpiando y transformando el nombre a minúsculas en formato `slugify()`.
4. **Protección de Eliminación**: No se puede eliminar un rol si existen usuarios asignados (`usuariosPorRol[r.id] > 0`).

---

## 4. ANÁLISIS DE LA BASE DE DATOS Y PERSISTENCIA
- Los roles personalizados se guardan como un arreglo serializado `JSON.stringify(toSave)` dentro del modelo `Configuracion` (llave `roles_personalizados`).
- El campo `rol` en el modelo `Usuario` almacena la cadena `id` del rol asignado.
