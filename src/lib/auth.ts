import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        usuario: { label: 'Usuario', type: 'text' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.usuario || !credentials?.password) return null
        const user = await prisma.usuario.findUnique({
          where: { usuario: credentials.usuario as string, activo: true },
        })
        if (!user) return null
        const ok = await bcrypt.compare(credentials.password as string, user.password)
        if (!ok) return null
        return { id: String(user.id), name: user.nombre, email: user.usuario, role: user.rol }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) { token.role = (user as any).role; token.id = user.id }
      return token
    },
    session({ session, token }) {
      if (token) { session.user.role = token.role as string; session.user.id = token.id as string }
      return session
    },
  },
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
})

declare module 'next-auth' {
  interface Session { user: { id: string; name: string; email: string; role: string } }
}
