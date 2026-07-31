import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { authorizeUser, refreshTokenClaims } from '@/modules/auth/services/authBusiness'

export const authService = NextAuth({
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,

  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        usuario: { label: 'Usuario', type: 'text' },
        password: { label: 'Contrasena', type: 'password' },
      },
      authorize: authorizeUser,
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
      if (trigger === 'update') {
        return refreshTokenClaims(token)
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
