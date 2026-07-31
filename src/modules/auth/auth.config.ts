export const AUTH_PAGES = {
  signIn: '/login',
  error: '/login',
}

export const AUTH_SESSION = {
  strategy: 'jwt' as const,
  maxAge: 8 * 60 * 60,
}

export const PREDEFINED_ROLES = ['admin', 'cajero', 'supervisor', 'bodega', 'contador'] as const
