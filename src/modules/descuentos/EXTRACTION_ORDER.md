# EXTRACTION_ORDER.md - ORDEN DE EXTRACCIÓN Y CONSTRUCCIÓN V2

Para garantizar que el módulo se construya sin errores de compilación, se debe seguir estrictamente la siguiente secuencia de menor a mayor nivel de abstracción:

```
[1. Types & DTOs] ──> [2. Validators] ──> [3. Logic (Casos de Uso)] ──> [4. Repository] ──> [5. Service] ──> [6. Hooks] ──> [7. UI Views]
```

---

## SECUENCIA PASO A PASO
1. **Paso 1 (Types & DTOs)**: Crear `src/modules/descuentos/types/index.ts` y `dto/DescuentoDTO.ts` definiendo las interfaces exactas de entrada y salida.
2. **Paso 2 (Validators)**: Crear `src/modules/descuentos/validators/descuentoValidator.ts` especificando el esquema Zod de validación.
3. **Paso 3 (Logic)**: Extraer las funciones puras de validación de vigencia, cálculo de montos y límites de uso en `logic/validarDescuento.ts` con sus pruebas unitarias en `tests/unit/`.
4. **Paso 4 (Repository & Mapper)**: Crear `mappers/descuentoMapper.ts` y `repositories/descuentosRepository.ts` aislando el acceso a Prisma.
5. **Paso 5 (Service)**: Crear `services/descuentosService.ts` implementando las llamadas HTTP mediante `fetchClient`.
6. **Paso 6 (Hooks & ViewModel)**: Crear `hooks/useDescuentos.ts` orquestando el estado y la comunicación con el servicio.
7. **Paso 7 (UI Views & Components)**: Crear `components/DescuentosTabla.tsx`, `components/DescuentoFormModal.tsx` y `views/DescuentosView.tsx` utilizando las primitivas del Design System (`src/ui/`).
8. **Paso 8 (Public API & Route)**: Exportar contratos en `src/modules/descuentos/index.ts` y conectar la vista en `src/app/(dashboard)/descuentos/page.tsx`.
