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

        const user = await prisma.usuario.findUnique({
          where: { usuario: credentials.usuario as string, activo: true },
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
              const hoursAgo = new Date(Date.now() - 8 * 60 * 60 * 1000)
              if (existing.lastActivity > hoursAgo) {
                // Active session exists — block login
                throw new Error('SESION_ACTIVA')
              }
              // Expired session — clean it up
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

        return {
          id: String(user.id),
          name: user.nombre,
          email: user.usuario,
          role: user.rol,
          sessionToken,
          permisos: user.permisos || '',
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.id = user.id
        token.sessionToken = (user as any).sessionToken
        token.permisos = (user as any).permisos || ''
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
