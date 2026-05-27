'use client'
import { signOut } from 'next-auth/react'

interface TopbarProps {
  user: { name?: string | null; email?: string | null; role?: string }
}

export default function Topbar({ user }: TopbarProps) {
  return (
    <div style={{
      background: '#0d0f1a', height: 54, display: 'flex', alignItems: 'center',
      padding: '0 16px', gap: 12, flexShrink: 0,
      borderBottom: '1px solid rgba(255,255,255,.06)', zIndex: 50
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <svg width="26" height="26" viewBox="0 0 200 200" fill="none">
          <rect width="200" height="200" rx="40" fill="#1a1f36"/>
          <rect x="30" y="60" width="140" height="100" rx="12" stroke="#2B7FD4" strokeWidth="8"/>
          <line x1="30" y1="90" x2="170" y2="90" stroke="#2B7FD4" strokeWidth="6"/>
          <rect x="55" y="105" width="20" height="16" rx="3" fill="#2B7FD4"/>
          <rect x="90" y="105" width="20" height="16" rx="3" fill="#2B7FD4"/>
          <rect x="125" y="105" width="20" height="16" rx="3" fill="#2B7FD4"/>
        </svg>
        <span style={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>
          WS <span style={{ color: '#2B7FD4' }}>POS</span>
        </span>
      </div>

      <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,.1)' }} />

      <span style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', fontWeight: 500 }}>
        Sistema de Facturación
      </span>

      {/* Right */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(255,255,255,.07)', borderRadius: 20, padding: '4px 12px 4px 6px'
        }}>
          <div style={{
            width: 26, height: 26, background: '#2B7FD4', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0
          }}>
            {(user.name || 'U')[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.8)', fontWeight: 500 }}>{user.name}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.4)', textTransform: 'capitalize' }}>{user.role}</div>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          style={{
            background: 'rgba(239,68,68,.15)', color: '#ef4444', border: 'none',
            padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit'
          }}
        >
          Salir
        </button>
      </div>
    </div>
  )
}
