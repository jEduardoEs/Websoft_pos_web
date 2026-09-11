export const metadata = {
  title: 'WebSoft Solutions — Sistema POS',
  description: 'Sistema de facturacion y gestion WebSoft Solutions',
  icons: {
    icon: 'https://websoftsolutions.com.gt/logo.png',
    apple: 'https://websoftsolutions.com.gt/logo.png',
  },
}

export const auth = {
  signIn: '/login',
  error: '/login',
  session: {
    strategy: 'jwt' as const,
    maxAge: 8 * 60 * 60,
  },
}
