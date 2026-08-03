# CIRCULAR_DEPENDENCY_REPORT.md - REPORTE DE DEPENDENCIAS CIRCULARES

- **Módulo**: `Descuentos` (`src/modules/descuentos/`)

---

## 1. GRAFO DE DIRECCIONALIDAD DE IMPORTACIÓN
```
views ──> components ──> hooks ──> services ──> fetchClient
                          │
                          ▼
                        logic ──> dto / types
                          ▲
                          │
repositories ──> mappers ─┘
     │
     ▼
Prisma ORM
```

---

## 2. RESULTADO DE AUDITORÍA DE CICLOS
- La dirección de importación fluye en un solo sentido descendente desde la UI hasta el Dominio e Infraestructura.
- **Cero Dependencias Circulares Detectadas (0 Cycles)**. **[APROBADO]**
