import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Topbar from '@/components/Topbar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', flexDirection: 'column' }}>
      <Topbar user={session.user} />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar role={session.user.role} />
        <main style={{ flex: 1, overflowY: 'auto', background: '#f0f4f8' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
