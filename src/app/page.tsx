import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Acceso al sistema',
  description: 'Inicio del sistema WebSoft Solutions para acceder al panel POS y la gestión empresarial.',
  alternates: {
    canonical: 'https://websoftsolutions.com.gt',
  },
}

export default async function HomePage() {
  const session = await auth()
  if (session) redirect('/dashboard')
  else redirect('/login')
}
