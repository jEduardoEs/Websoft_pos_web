import { auth } from '@/lib/auth'
import Providers from '@/components/Providers'
import { redirect } from 'next/navigation'
import Topbar from '@/components/Topbar'
import MobileLayout from '@/components/MobileLayout'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <Providers>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', flexDirection: 'column' }}>
        <Topbar user={session.user} />
        <MobileLayout>{children}</MobileLayout>
      </div>
    </Providers>
  )
}
