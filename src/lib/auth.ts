import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
console.log("******** AUTH.TS CARGADO ********")
function generateToken() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        usuario: { label: 'Usuario', type: 'text' },
        password: { label: 'Contrasena', type: 'password' },
      },
      async authorize(credentials) {
  console.log('========== [AUTH] INICIO LOGIN ==========')

  if (!credentials?.usuario || !credentials?.password) {
    console.warn('[AUTH] Credenciales incompletas')
    return null
  }

  console.log('[AUTH] Usuario recibido:', credentials.usuario)

  console.log("[AUTH] Base de datos:", process.env.DATABASE_URL)
  const user = await prisma.usuario.findFirst({
    where: {
      usuario: {
        equals: credentials.usuario as string,
        mode: 'insensitive',
      },
      activo: true,
    },
  })

  console.log(
    '[AUTH] Usuario encontrado:',
    user
      ? {
          id: user.id,
          usuario: user.usuario,
          nombre: user.nombre,
          rol: user.rol,
          activo: user.activo,
        }
      : null
  )

  if (!user) {
    console.warn('[AUTH] Usuario no encontrado o inactivo')
    return null
  }

  const ok = await bcrypt.compare(
    credentials.password as string,
    user.password
  )

  console.log('[AUTH] Password correcta:', ok)

  if (!ok) {
    console.warn('[AUTH] Password incorrecta')
    return null
  }

  // Check for active session (non-admin only)
  if (user.rol !== 'admin') {
    try {
      console.log('[AUTH] Verificando sesión activa...')

      const existing = await prisma.activeSession.findUnique({
        where: { usuarioId: user.id },
      })

      console.log('[AUTH] Sesión encontrada:', existing)

      if (existing) {
        console.log('[AUTH] Eliminando sesión anterior...')

        await prisma.activeSession.delete({
          where: { usuarioId: user.id },
        })

        console.log('[AUTH] Sesión eliminada correctamente')
      }
    } catch (e) {
      console.error('[AUTH] Error manejando ActiveSession:', e)
    }
  }

  const sessionToken = generateToken()

  console.log('[AUTH] SessionToken generado:', sessionToken)

  try {
    await prisma.activeSession.upsert({
      where: { usuarioId: user.id },
      update: {
        sessionToken,
        lastActivity: new Date(),
      },
      create: {
        usuarioId: user.id,
        sessionToken,
        lastActivity: new Date(),
      },
    })

    console.log('[AUTH] ActiveSession registrada')
  } catch (e) {
    console.error('[AUTH] Error registrando ActiveSession:', e)
  }

  let permisosResueltos = user.permisos || ''

  try {
    console.log('[AUTH] Resolviendo permisos...')

    const parsed = permisosResueltos
      ? JSON.parse(permisosResueltos)
      : []

    if (!Array.isArray(parsed) || parsed.length === 0) {
      console.log('[AUTH] Buscando permisos por rol...')

      const cfgRoles = await prisma.config.findUnique({
        where: { clave: 'roles_personalizados' },
      })

      const roles = cfgRoles
        ? JSON.parse(cfgRoles.valor || '[]')
        : []

      const rolDef = roles.find((r: any) => r.id === user.rol)

      if (rolDef?.permisos?.length) {
        permisosResueltos = JSON.stringify(rolDef.permisos)

        await prisma.usuario.update({
          where: { id: user.id },
          data: { permisos: permisosResueltos },
        })

        console.log('[AUTH] Permisos sincronizados')
      }
    }
  } catch (e) {
    console.error('[AUTH] Error resolviendo permisos:', e)
  }

  console.log('[AUTH] Login autorizado')

  const authUser = {
    id: String(user.id),
    name: user.nombre,
    email: user.usuario,
    role: user.rol,
    sessionToken,
    permisos: permisosResueltos,
  }

  console.log('[AUTH] Usuario retornado:', {
    id: authUser.id,
    usuario: authUser.email,
    rol: authUser.role,
  })

  console.log('========== [AUTH] FIN LOGIN ==========')

  return authUser
},
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.role = (user as any).role
        token.id = user.id
        token.sessionToken = (user as any).sessionToken
        token.permisos = (user as any).permisos || ''
      }
      // Cuando se llama session.update() desde el cliente, recargar permisos frescos desde la DB
      if (trigger === 'update' && token.id) {
        try {
          const fresh = await prisma.usuario.findUnique({ where: { id: parseInt(token.id as string) } })
          if (fresh) {
            token.permisos = fresh.permisos || ''
            token.role = fresh.rol
          }
        } catch { /* ignore */ }
      }
      return token
    },
    session({ session, token }) {
      if (token) {
        session.user.role = token.role as string
        session.user.id = token.id as string
        session.user.sessionToken = token.sessionToken as string
        session.user.permisos = token.permisos as string
      }
      return session
    },
  },
  pages: { signIn: '/login', error: '/login' },
  session: { strategy: 'jwt', maxAge: 8 * 60 * 60 },
})

declare module 'next-auth' {
  interface Session {
    user: { id: string; name: string; email: string; role: string; sessionToken: string; permisos: string }
  }
}
