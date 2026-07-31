'use client'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import MobileLayoutView from '@/components/views/MobileLayoutView'

export default function MobileLayoutContainer({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  return (
    <MobileLayoutView
      sidebarOpen={sidebarOpen}
      onToggle={() => setSidebarOpen((prev) => !prev)}
      onClose={() => setSidebarOpen(false)}
      pathname={pathname}
    >
      {children}
    </MobileLayoutView>
  )
}
