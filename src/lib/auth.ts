import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        usuario: { label: 'Usuario', type: 'text' },
        password: { label: 'Contrasena', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.usuario || !credentials?.password) return null

        const user = await prisma.usuario.findUnique({
          where: { usuario: credentials.usuario as string, activo: true },
        })
        if (!user) return null

        const ok = await bcrypt.compare(credentials.password as string, user.password)
        if (!ok) return null

        // Check if there's already an active session for this user (non-admin)
        // Admin can have multiple sessions
        if (user.rol !== 'admin') {
          try {
            const existing = await prisma.activeSession.findUnique({
              where: { usuarioId: user.id }
            })
            if (existing) {
              // Check if session is recent (last 8 hours)
              const hoursAgo = new Date(Date.now() - 8 * 60 * 60 * 1000)
              if (existing.lastActivity > hoursAgo) {
                // Block login — session still active
                throw new Error('SESION_ACTIVA')
              } else {
                // Session expired — remove it
                await prisma.activeSession.delete({ where: { usuarioId: user.id } })
              }
            }
          } catch (e: any) {
            if (e.message === 'SESION_ACTIVA') throw e
            // Ignore DB errors for session check
          }
        }

        const sessionToken = randomUUID()

        // Register active session
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
      }
      return token
    },
    session({ session, token }) {
      if (token) {
        session.user.role = token.role as string
        session.user.id = token.id as string
        session.user.sessionToken = token.sessionToken as string
      }
      return session
    },
  },
  pages: { signIn: '/login', error: '/login' },
  session: { strategy: 'jwt', maxAge: 8 * 60 * 60 }, // 8 hours
})

declare module 'next-auth' {
  interface Session {
    user: { id: string; name: string; email: string; role: string; sessionToken: string }
  }
}
