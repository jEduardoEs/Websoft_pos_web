# WS POS Web — Sistema de Facturación

Sistema POS profesional full-stack para web, listo para desplegar en **Vercel + Neon (PostgreSQL)**.

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 14 (App Router) |
| Base de datos | PostgreSQL (Neon.tech) |
| ORM | Prisma |
| Autenticación | NextAuth v5 (JWT) |
| Estilos | Tailwind CSS |
| Gráficas | Recharts |
| Hosting | Vercel |

## Módulos incluidos

- ✅ Login con roles (Admin / Cajero)
- ✅ Dashboard con estadísticas del día
- ✅ POS — punto de venta con carrito en tiempo real
- ✅ Historial de ventas con filtros y anulación
- ✅ Inventario con CRUD y Kardex
- ✅ Clientes
- ✅ Proveedores
- ✅ Compras (actualiza stock automáticamente)
- ✅ Devoluciones (restaura stock)
- ✅ Códigos de descuento
- ✅ Cierre de caja
- ✅ Apertura/cierre de turno
- ✅ Reportes con gráficas (barras, pie)
- ✅ Configuración de empresa
- ✅ Gestión de usuarios
- ✅ Impresión de ticket (ventana del navegador)
- ✅ Log de auditoría

---

## Despliegue en Vercel (paso a paso)

### 1. Base de datos — Neon (gratis)

1. Ve a [neon.tech](https://neon.tech) y crea una cuenta gratuita
2. Crea un nuevo proyecto → copia las URLs de conexión:
   - `DATABASE_URL` (connection pooling)
   - `DIRECT_URL` (direct connection)

### 2. Subir código a GitHub

```bash
git init
git add .
git commit -m "Initial commit - WS POS Web"
git remote add origin https://github.com/TU_USUARIO/ws-pos-web.git
git push -u origin main
```

### 3. Desplegar en Vercel

1. Ve a [vercel.com](https://vercel.com) → New Project → importa tu repo
2. En **Environment Variables**, agrega:

```
DATABASE_URL = postgresql://user:pass@ep-xxx.neon.tech/ws_pos?sslmode=require
DIRECT_URL   = postgresql://user:pass@ep-xxx.neon.tech/ws_pos?sslmode=require
NEXTAUTH_SECRET = (genera con: openssl rand -base64 32)
NEXTAUTH_URL = https://TU-APP.vercel.app
```

3. Build command: `prisma generate && next build`
4. Deploy!

### 4. Inicializar la base de datos

Después del primer deploy, ejecuta desde tu máquina:

```bash
# Instala dependencias localmente
npm install

# Crea las tablas en Neon
npx prisma db push

# Carga datos iniciales (usuarios + productos de ejemplo)
npm run db:seed
```

### 5. Acceder al sistema

- URL: `https://tu-app.vercel.app`
- **Admin:** usuario `admin` / contraseña `admin123`
- **Cajero:** usuario `cajero` / contraseña `cajero123`

> ⚠️ **Cambia las contraseñas en el primer uso** (Módulo Usuarios)

---

## Desarrollo local

```bash
# 1. Clonar
git clone https://github.com/TU_USUARIO/ws-pos-web.git
cd ws-pos-web

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Edita .env.local con tus credenciales de Neon

# 4. Inicializar BD
npx prisma db push
npm run db:seed

# 5. Iniciar servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

---

## Estructura del proyecto

```
ws-pos-web/
├── prisma/
│   ├── schema.prisma     # Esquema de la BD (16 tablas)
│   └── seed.ts           # Datos iniciales
├── src/
│   ├── app/
│   │   ├── api/          # API Routes (REST)
│   │   │   ├── auth/     # NextAuth
│   │   │   ├── ventas/
│   │   │   ├── productos/
│   │   │   ├── clientes/
│   │   │   └── ...
│   │   ├── (auth)/
│   │   │   └── login/
│   │   └── (dashboard)/
│   │       ├── pos/
│   │       ├── ventas/
│   │       ├── inventario/
│   │       └── ...
│   ├── components/
│   │   ├── Sidebar.tsx
│   │   └── Topbar.tsx
│   └── lib/
│       ├── auth.ts       # NextAuth config
│       ├── prisma.ts     # Cliente Prisma
│       └── utils.ts      # Helpers
└── README.md
```

---

## Personalización

### Cambiar el nombre/logo de la empresa
Ve a **Configuración → Empresa** en el sistema.

### Cambiar IVA
Ve a **Configuración → Sistema** → IVA (%).

### Agregar categorías de productos
Las categorías se crean automáticamente al agregar productos en Inventario.

---

## Seguridad

- Contraseñas hasheadas con bcrypt (12 rounds)
- Sesiones JWT firmadas
- Middleware de autenticación en todas las rutas
- Roles: `admin` (acceso total) / `cajero` (acceso limitado)
- Log de auditoría en operaciones críticas

---

## Soporte

Credenciales por defecto:
| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| admin | admin123 | Administrador |
| cajero | cajero123 | Cajero |

**Cambia estas contraseñas inmediatamente después del primer login.**
