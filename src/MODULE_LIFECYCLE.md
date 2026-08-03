# CICLO DE VIDA DE UN MÓDULO EN LA ARQUITECTURA V2

Este documento rige las 4 etapas del ciclo de vida de cualquier módulo funcional del ERP/POS:

```
[ 1. NACIMIENTO ] ──> [ 2. EVOLUCIÓN ] ──> [ 3. DEPRECACIÓN ] ──> [ 4. ELIMINACIÓN ]
```

---

## 1. ETAPA DE NACIMIENTO (NUEVO MÓDULO)
1. **Clonación de la Plantilla**: Se duplica la plantilla empresarial `src/modules/__template/` renombrándola en `kebab-case` (ej. `src/modules/inventario/`).
2. **Definición del Contrato (`index.ts`)**: Se establecen las interfaces y DTOs públicos que el módulo expondrá al resto del ERP.
3. **Desarrollo de las 17 Capas**: Se implementan ordenadamente desde el Dominio (`logic/`), pasando por DTOs, Mappers, Repositorios, Servicios, Hooks y Vistas.
4. **Verificación de Checklist**: Se exige el cumplimiento del 100% de `MODULE_CHECKLIST.md` antes de conectar la ruta en App Router.

---

## 2. ETAPA DE EVOLUCIÓN (MANTENIMIENTO Y EXTENSIÓN)
1. **Adición de Nuevas Reglas**: Cualquier cambio en reglas de negocio debe agregarse únicamente en `logic/` con su respectiva prueba unitaria en `tests/unit/`.
2. **Control de Tamaño**: Ningún archivo dentro del módulo puede superar los límites establecidos en `CODING_STANDARDS.md` (ej. Views máx 250 líneas, Logic máx 150 líneas).
3. **Compatibilidad Hacia Atrás**: Si se modifica un DTO público en `dto/`, se deben mantener las propiedades opcionales para no romper módulos dependientes.

---

## 3. ETAPA DE DEPRECACIÓN
1. **Marca de Deprecación**: Si un servicio o método público será reemplazado, se debe marcar con el decorador `@deprecated` o JSDoc `@deprecated`.
2. **Periodo de Gracia**: El servicio deprecado debe continuar operando durante al menos 1 fase de lanzamiento previa a su remoción.
3. **Registro de Advertencia**: Invocaciones a métodos deprecados deben emitir un `logger.warn()` en desarrollo.

---

## 4. ETAPA DE ELIMINACIÓN
1. **Verificación de Cero Dependencias**: Confirmar que ningún otro módulo importe contratos desde el `index.ts` del módulo a eliminar.
2. **Remoción Segura**: Eliminación del directorio `src/modules/[modulo]/` y de su ruta envoltorio en `src/app/`.
3. **Actualización de Permisos**: Retirar el ID del módulo deprecado del catálogo central de permisos (`src/config/permissions.ts`).
