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
      }
    }

    return () => clearInterval(ping)
  }, [user.role])

  return (
    <div style={{
      background: '#ffffff', height: 56, display: 'flex', alignItems: 'center',
      padding: '0 20px', gap: 14, flexShrink: 0,
      borderBottom: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,.06)', zIndex: 50,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <img src="https://websoft-solutions.vercel.app/logo.png" alt="WebSoft"
          style={{ width: 34, height: 34, borderRadius: 8, objectFit: 'contain' }}
          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Web</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#2563eb' }}>Soft</span>
          <span style={{ fontSize: 16, fontWeight: 400, color: '#0f172a', marginLeft: 4 }}>Solutions</span>
        </div>
      </div>
      <div style={{ width: 1, height: 22, background: '#e2e8f0', margin: '0 4px' }} />
      <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>Sistema POS</span>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
        {user.role === 'admin' && (
          <div style={{ fontSize: 10, color: '#94a3b8', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '3px 8px' }}>
            Sesion expira por inactividad 30min
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 22, padding: '4px 12px 4px 5px' }}>
          <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
            {(user.name || 'U')[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#0f172a', fontWeight: 600, lineHeight: 1.2 }}>{user.name}</div>
            <div style={{ fontSize: 10, color: '#64748b', textTransform: 'capitalize' }}>{user.role}</div>
          </div>
        </div>
        <button onClick={handleSignOut} style={{ background: '#fff', color: '#dc2626', border: '1px solid #fecaca', padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          Salir
        </button>
      </div>
    </div>
  )
}
