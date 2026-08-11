'use client'
import { signOut } from 'next-auth/react'
import { useEffect, useRef } from 'react'

interface TopbarProps {
  user: { name?: string | null; email?: string | null; role?: string }
}

export default function Topbar({ user }: TopbarProps) {
  const inactivityRef = useRef<NodeJS.Timeout | null>(null)
  const ADMIN_TIMEOUT = 30 * 60 * 1000 // 30 min inactivity for admin

  const handleSignOut = async () => {
    try { await fetch('/api/sesion/cerrar', { method: 'POST' }) } catch {}
    signOut({ callbackUrl: '/login' })
  }

  useEffect(() => {
    // Ping server every 3 minutes to keep session alive
    const ping = setInterval(() => {
      fetch('/api/sesion', { method: 'POST' }).catch(() => {})
    }, 3 * 60 * 1000)

    // Cerrar sesion automaticamente al cerrar la pestaña/navegador
    const handleUnload = () => {
      try {
        navigator.sendBeacon('/api/sesion/cerrar', new Blob([], { type: 'application/json' }))
      } catch {}
    }
    window.addEventListener('pagehide', handleUnload)
    window.addEventListener('beforeunload', handleUnload)

    // Admin inactivity timeout
    if (user.role === 'admin') {
      const resetTimer = () => {
        if (inactivityRef.current) clearTimeout(inactivityRef.current)
        inactivityRef.current = setTimeout(async () => {
          try { await fetch('/api/sesion/cerrar', { method: 'POST' }) } catch {}
          signOut({ callbackUrl: '/login' })
        }, ADMIN_TIMEOUT)
      }
      resetTimer()
      const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click']
      events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }))
      return () => {
        clearInterval(ping)
        if (inactivityRef.current) clearTimeout(inactivityRef.current)
        events.forEach(e => window.removeEventListener(e, resetTimer))
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

  return (
    <div style={{
      background: '#ffffff', height: 56, display: 'flex', alignItems: 'center',
      padding: '0 16px', gap: 10, flexShrink: 0,
      borderBottom: '1.5px solid #e3e1d8', zIndex: 50,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <img src="https://websoftsolutions.com.gt/logo.png" alt="WebSoft"
          style={{ width: 30, height: 30, borderRadius: 6, objectFit: 'contain', flexShrink: 0 }}
          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#18181b' }}>Web</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#1581E3' }}>Soft</span>
          <span className="topbar-subtitle" style={{ fontSize: 15, fontWeight: 400, color: '#18181b', marginLeft: 4 }}>Solutions</span>
        </div>
      </div>
      <span className="topbar-sistema" style={{ fontSize: 10, color: '#8a887e', fontWeight: 500, flexShrink: 0 }}>Sistema POS</span>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
        {user.role === 'admin' && (
          <div className="topbar-inactivity" style={{ fontSize: 10, color: '#8a887e', background: '#f4f3ef', border: '1px solid #e3e1d8', borderRadius: 4, padding: '3px 8px' }}>
            Sesion expira 30min
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#f4f3ef', border: '1.5px solid #e3e1d8', borderRadius: 20, padding: '3px 10px 3px 4px' }}>
          <div style={{ width: 26, height: 26, background: '#18181b', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
            {(user.name || 'U')[0].toUpperCase()}
          </div>
          <div className="topbar-userinfo">
            <div style={{ fontSize: 12, color: '#18181b', fontWeight: 600, lineHeight: 1.2, whiteSpace: 'nowrap', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
            <div style={{ fontSize: 10, color: '#8a887e', textTransform: 'capitalize' }}>{user.role}</div>
          </div>
        </div>
        <button onClick={handleSignOut} style={{ background: '#fff', color: '#b13a2e', border: '1.5px solid #e3c3bd', padding: '5px 12px', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
          Salir
        </button>
      </div>

      <style>{`
        @media (max-width: 480px) {
          .topbar-subtitle { display: none; }
          .topbar-sistema { display: none; }
          .topbar-inactivity { display: none; }
          .topbar-userinfo { display: none; }
        }
      `}</style>
    </div>
  )
}
