import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

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
        if (!credentials?.usuario || !credentials?.password) return null

        const user = await prisma.usuario.findFirst({
          where: { usuario: { equals: credentials.usuario as string, mode: 'insensitive' }, activo: true },
        })
        if (!user) return null

        const ok = await bcrypt.compare(credentials.password as string, user.password)
        if (!ok) return null

        // Check for active session (non-admin only)
        if (user.rol !== 'admin') {
          try {
            const existing = await prisma.activeSession.findUnique({
              where: { usuarioId: user.id }
            })
            if (existing) {
              const hoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000) // 24h
              if (existing.lastActivity > hoursAgo) {
                throw new Error('SESION_ACTIVA')
              }
              // Sesión expirada — limpiar
              await prisma.activeSession.delete({ where: { usuarioId: user.id } })
            }
          } catch (e: any) {
            if (e.message === 'SESION_ACTIVA') throw e
          }
        }

        const sessionToken = generateToken()

        // Register session
        try {
          await prisma.activeSession.upsert({
            where: { usuarioId: user.id },
            update: { sessionToken, lastActivity: new Date() },
            create: { usuarioId: user.id, sessionToken, lastActivity: new Date() },
          })
        } catch { /* ignore */ }

        // Resolver permisos: si el usuario no tiene permisos guardados (o el array viene vacío),
        // buscar los permisos definidos actualmente para su rol en el catálogo de roles personalizados.
        let permisosResueltos = user.permisos || ''
        try {
          const parsed = permisosResueltos ? JSON.parse(permisosResueltos) : []
          if (!Array.isArray(parsed) || parsed.length === 0) {
            const cfgRoles = await prisma.config.findUnique({ where: { clave: 'roles_personalizados' } })
            const roles = cfgRoles ? JSON.parse(cfgRoles.valor || '[]') : []
            const rolDef = roles.find((r: any) => r.id === user.rol)
            if (rolDef?.permisos?.length) {
              permisosResueltos = JSON.stringify(rolDef.permisos)
              // Persistir para que quede sincronizado de ahora en adelante
              await prisma.usuario.update({ where: { id: user.id }, data: { permisos: permisosResueltos } })
            }
          }
        } catch { /* si falla el parseo, se usa el valor original */ }

        return {
          id: String(user.id),
          name: user.nombre,
          email: user.usuario,
          role: user.rol,
          sessionToken,
          permisos: permisosResueltos,
        }
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
