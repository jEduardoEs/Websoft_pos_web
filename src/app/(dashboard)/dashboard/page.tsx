import type { Metadata } from 'next'
import DashboardModule from '@/modules/dashboard/components/DashboardModule'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Panel principal del sistema POS con ventas del día, metas y pendientes.',
  alternates: {
    canonical: 'https://websoftsolutions.com.gt/dashboard',
  },
}

export default function DashboardPage() {
  return <DashboardModule />
}
