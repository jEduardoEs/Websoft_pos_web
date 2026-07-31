'use client'
import { useEffect, useRef } from 'react'
import { signOut } from 'next-auth/react'
import TopbarView from '@/components/views/TopbarView'

interface TopbarContainerProps {
  user: { name?: string | null; email?: string | null; role?: string }
}

export default function TopbarContainer({ user }: TopbarContainerProps) {
  const inactivityRef = useRef<NodeJS.Timeout | null>(null)
  const ADMIN_TIMEOUT = 30 * 60 * 1000

  const handleSignOut = async () => {
    try {
      await fetch('/api/sesion/cerrar', { method: 'POST', credentials: 'include' })
    } catch {}

    try {
      await signOut({ redirect: false })
    } catch {}

    window.location.href = '/login'
  }

  useEffect(() => {
    const ping = setInterval(() => {
      fetch('/api/sesion', { method: 'POST' }).catch(() => {})
    }, 3 * 60 * 1000)

    const handleUnload = () => {
      try {
        navigator.sendBeacon('/api/sesion/cerrar', new Blob([], { type: 'application/json' }))
      } catch {}
    }
    window.addEventListener('pagehide', handleUnload)
    window.addEventListener('beforeunload', handleUnload)

    if (user.role === 'admin') {
      const resetTimer = () => {
        if (inactivityRef.current) clearTimeout(inactivityRef.current)
        inactivityRef.current = setTimeout(async () => {
          try { await fetch('/api/sesion/cerrar', { method: 'POST', credentials: 'include' }) } catch {}
          try { await signOut({ redirect: false }) } catch {}
          window.location.href = '/login'
        }, ADMIN_TIMEOUT)
      }
      resetTimer()
      const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'] as const
      events.forEach((e) => window.addEventListener(e, resetTimer, { passive: true }))
      return () => {
        clearInterval(ping)
        if (inactivityRef.current) clearTimeout(inactivityRef.current)
        events.forEach((e) => window.removeEventListener(e, resetTimer))
        window.removeEventListener('pagehide', handleUnload)
        window.removeEventListener('beforeunload', handleUnload)
      }
    }

    return () => {
      clearInterval(ping)
      window.removeEventListener('pagehide', handleUnload)
      window.removeEventListener('beforeunload', handleUnload)
    }
  }, [user.role])

  return <TopbarView user={user} onSignOut={handleSignOut} />
}
