import NextAuth, { type NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { credentialsSchema } from './auth.validators'
import { authorizeUser, refreshTokenClaims } from './auth.business'
import { AUTH_PAGES, AUTH_SESSION } from './auth.config'

const credentialsProvider = Credentials({
  name: 'credentials',
  credentials: {
    usuario: { label: 'Usuario', type: 'text' },
    password: { label: 'Contrasena', type: 'password' },
  },
  async authorize(credentials) {
    const parsed = credentialsSchema.safeParse(credentials || {})
    if (!parsed.success) return null
    return authorizeUser(parsed.data)
  },
})

export const authOptions: NextAuthConfig = {
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  providers: [credentialsProvider],
  callbacks: {
    async jwt(context) {
      if (context.user) {
        context.token = await refreshTokenClaims(context)
      }
      if (context.trigger === 'update') {
        context.token = await refreshTokenClaims(context)
      }
      return context.token
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
  pages: AUTH_PAGES,
  session: AUTH_SESSION,
}

export const authService = NextAuth(authOptions)
