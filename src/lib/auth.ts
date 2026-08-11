import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { authConfig } from '@/auth.config'

function generateToken() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  trustHost: true,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        usuario: { label: 'Usuario', type: 'text' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.usuario || !credentials?.password) {
          console.warn('[AUTH] Credenciales incompletas')
          return null
        }
        const user = await prisma.usuario.findFirst({
          where: {
            usuario: {
              equals: credentials.usuario as string,
              mode: 'insensitive',
            },
            activo: true,
          },
        })

        if (!user) {
          console.warn('[AUTH] Usuario no encontrado o inactivo')
          return null
        }

        const ok = await bcrypt.compare(credentials.password as string, user.password)
        if (!ok) {
          console.warn('[AUTH] Password incorrecta')
          return null
        }

        if (user.rol !== 'admin') {
          try {
            const existing = await prisma.activeSession.findUnique({
              where: { usuarioId: user.id },
            })
            if (existing) {
              await prisma.activeSession.delete({
                where: { usuarioId: user.id },
              })
            }
          } catch (e) {
            console.error('[AUTH] Error manejando ActiveSession:', e)
          }
        }

        const sessionToken = generateToken()
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
        } catch (e) {
          console.error('[AUTH] Error registrando ActiveSession:', e)
        }

        let permisosResueltos = user.permisos || ''
        try {
          const parsed = permisosResueltos ? JSON.parse(permisosResueltos) : []
          if (!Array.isArray(parsed) || parsed.length === 0) {
            const cfgRoles = await prisma.config.findUnique({
              where: { clave: 'roles_personalizados' },
            })
            const roles = cfgRoles ? JSON.parse(cfgRoles.valor || '[]') : []
            const rolDef = roles.find((r: any) => r.id === user.rol)
            if (rolDef?.permisos?.length) {
              permisosResueltos = JSON.stringify(rolDef.permisos)
              await prisma.usuario.update({
                where: { id: user.id },
                data: { permisos: permisosResueltos },
              })
            }
          }
        } catch (e) {
          console.error('[AUTH] Error resolviendo permisos:', e)
        }

        const authUser = {
          id: String(user.id),
          name: user.nombre,
          email: user.usuario,
          role: user.rol,
          sessionToken,
          permisos: permisosResueltos,
        }

        return authUser
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger }) {
      if (authConfig.callbacks?.jwt) {
        token = (await authConfig.callbacks.jwt({ token, user, trigger, session: null, account: null as any, isNewUser: false, profile: undefined })) as any
      }
      
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
  },
})

declare module 'next-auth' {
  interface Session {
    user: { id: string; name: string; email: string; role: string; sessionToken: string; permisos: string }
  }
}
