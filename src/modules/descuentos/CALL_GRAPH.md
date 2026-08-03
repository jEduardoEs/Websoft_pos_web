# CALL_GRAPH.md - GRAFO DE LLAMADAS Y FLUJO DE CONTROL EN "DESCUENTOS"

```
[ Usuario (Navegador) ]
          │
          ▼
 [ DescuentosPage (page.tsx) ] ── (onClick: + Nuevo Código) ──> [ FormModal (Render JSX) ]
          │                                                              │
          ├──────────────── (save()) ────────────────────────────────────┘
          │                   │
          │                   ▼
          ├───────────> [ fetch('/api/descuentos', POST) ]
          │                   │
          │                   ▼
          │             [ route.ts: POST ] ──> [ auth() ] ──> [ prisma.descuento.create/update ]
          │
          ├──────────────── (del())
          │                   │
          │                   ▼
          ├───────────> [ fetch('/api/descuentos?id=X', DELETE) ]
          │                   │
          │                   ▼
          │             [ route.ts: DELETE ] ──> [ auth() ] ──> [ prisma.descuento.update(activo: false) ]
          │
          └──────────────── (load() en useEffect)
                              │
                              ▼
                        [ fetch('/api/descuentos', GET) ]
                              │
                              ▼
                        [ route.ts: GET ] ──> [ auth() ] ──> [ prisma.descuento.findMany ]

─────────────────────────────────────────────────────────────────────────────────────────────
[ Módulo POS (Cliente Externo) ]
          │
          ▼
 [ fetch('/api/descuentos/validar', POST) ]
          │
          ▼
 [ validar/route.ts: POST ] ──> [ auth() ] ──> [ prisma.descuento.findUnique ]
                                                     │
                                                     ▼
                                       [ Reglas de Vigencia / Mínimo / Usos ]
```
