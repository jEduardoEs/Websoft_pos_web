# CHECKLIST OBLIGATORIO DE REVISIÓN DE CÓDIGO (CODE REVIEW)

Este checklist es de **cumplimiento estricto** antes de aprobar o realizar merge de cualquier Pull Request (PR) en la Arquitectura V2:

---

## 1. AISLAMIENTO MODULAR Y CAPAS
- [ ] ¿El código nuevo reside en su carpeta correspondiente dentro de `src/modules/[modulo]/` o `src/shared/`?
- [ ] ¿Se respeta la Public API del módulo (`index.ts`) sin realizar importaciones internas profundas desde otros módulos?
- [ ] ¿La capa `views/` está libre de llamadas directas a `fetch()` y consultas a Prisma?
- [ ] ¿La capa `logic/` consiste únicamente en funciones puras sin dependencias de React ni DOM?

---

## 2. REGLAS DE SEGURIDAD Y PERMISOS
- [ ] ¿El API Handler en `src/app/api/` verifica explícitamente la sesión `auth()` y la función `tienePermiso()`?
- [ ] ¿Los insumos de entrada se validan mediante un esquema Zod de `validators/`?
- [ ] ¿No se exponen llaves secretas ni credenciales privadas en código consumido por el navegador?

---

## 3. ESTÁNDARES Y LÍMITES DE TAMAÑO
- [ ] ¿Se respetan los límites de líneas por archivo (Views máx 250, Logic máx 150, Repositories máx 200, Components máx 120)?
- [ ] ¿Se aplican las convenciones de nombrado, sufijos y prefijos de `src/NAMING_CONVENTIONS.md`?
- [ ] ¿No se utilizó el tipo `any` en ninguna declaración de TypeScript?

---

## 4. CALIDAD Y PRUEBAS
- [ ] ¿Las reglas de negocio nuevas en `logic/` incluyen sus respectivas pruebas unitarias en `tests/unit/`?
- [ ] ¿El proyecto compila exitosamente sin errores de compilación (`npm run build`)?
