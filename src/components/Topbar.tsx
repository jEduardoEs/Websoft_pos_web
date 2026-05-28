'use client'
import { signOut } from 'next-auth/react'

interface TopbarProps {
  user: { name?: string | null; email?: string | null; role?: string }
}

export default function Topbar({ user }: TopbarProps) {
  return (
    <div style={{
      background: '#0a1628',
      height: 56,
      display: 'flex',
      alignItems: 'center',
      padding: '0 18px',
      gap: 14,
      flexShrink: 0,
      borderBottom: '1px solid rgba(37,99,235,.2)',
      zIndex: 50,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <img
          src="https://websoft-solutions.vercel.app/logo.png"
          alt="WebSoft"
          style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'contain' }}
          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', lineHeight: 1, letterSpacing: -.3 }}>
            Web<span style={{ color: '#2563eb' }}>Soft</span>
          </div>
          <div style={{ fontSize: 8, color: '#60a5fa', letterSpacing: 2.5, fontWeight: 600 }}>SOLUTIONS</div>
        </div>
      </div>

      <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,.08)', margin: '0 4px' }} />
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', fontWeight: 600, letterSpacing: 1 }}>SISTEMA POS</span>

      {/* Right */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 9,
          background: 'rgba(255,255,255,.05)',
          border: '1px solid rgba(255,255,255,.08)',
          borderRadius: 22, padding: '4px 12px 4px 5px'
        }}>
          <div style={{
            width: 28, height: 28,
            background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0,
            boxShadow: '0 0 10px rgba(37,99,235,.4)',
          }}>
            {(user.name || 'U')[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.85)', fontWeight: 600, lineHeight: 1.2 }}>{user.name}</div>
            <div style={{ fontSize: 10, color: '#60a5fa', textTransform: 'capitalize', fontWeight: 500 }}>{user.role}</div>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          style={{
            background: 'rgba(239,68,68,.1)',
            color: '#f87171',
            border: '1px solid rgba(239,68,68,.2)',
            padding: '6px 14px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'all .2s',
          }}
        >
          Salir
        </button>
      </div>
    </div>
  )
}
