# DEPENDENCY_GRAPH.md - ARBOL DE DEPENDENCIAS EN "DESCUENTOS"

```
src/app/(dashboard)/descuentos/page.tsx
├── react (useState, useEffect)
├── sonner (toast.success, toast.error)
└── @/lib/utils (fmt, fmtDate)

src/app/api/descuentos/route.ts
├── next/server (NextRequest, NextResponse)
├── @/lib/prisma (prisma.descuento)
└── @/lib/auth (auth)

src/app/api/descuentos/validar/route.ts
├── next/server (NextRequest, NextResponse)
├── @/lib/prisma (prisma.descuento)
└── @/lib/auth (auth)
```
