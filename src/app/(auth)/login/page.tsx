'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ usuario: '', password: '' })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await signIn('credentials', { ...form, redirect: false })
    setLoading(false)
    if (res?.error) {
      toast.error('Usuario o contraseña incorrectos')
    } else {
      router.push('/pos')
      router.refresh()
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'linear-gradient(145deg, #0d0f1a, #0f1530)',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: '#fff', borderRadius: 18, padding: '40px 36px',
        width: 360, boxShadow: '0 30px 80px rgba(0,0,0,.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 24 }}>
          <svg width="36" height="36" viewBox="0 0 200 200" fill="none">
            <rect width="200" height="200" rx="40" fill="#1a1f36"/>
            <rect x="30" y="60" width="140" height="100" rx="12" stroke="#2B7FD4" strokeWidth="8"/>
            <line x1="30" y1="90" x2="170" y2="90" stroke="#2B7FD4" strokeWidth="6"/>
            <rect x="55" y="105" width="20" height="16" rx="3" fill="#2B7FD4"/>
            <rect x="90" y="105" width="20" height="16" rx="3" fill="#2B7FD4"/>
            <rect x="125" y="105" width="20" height="16" rx="3" fill="#2B7FD4"/>
          </svg>
          <span style={{ fontSize: 22, fontWeight: 700, color: '#1a1f36' }}>
            WS <span style={{ color: '#2B7FD4' }}>POS</span>
          </span>
        </div>

        <h2 style={{ fontSize: 17, fontWeight: 600, color: '#4a5568', marginBottom: 20, textAlign: 'center' }}>
          Iniciar sesión
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#4a5568', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.5px' }}>
              Usuario
            </label>
            <input
              className="input"
              type="text"
              value={form.usuario}
              onChange={e => setForm(f => ({ ...f, usuario: e.target.value }))}
              placeholder="admin"
              required
              autoFocus
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#4a5568', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.5px' }}>
              Contraseña
            </label>
            <input
              className="input"
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', padding: '13px', fontSize: 15 }}
            disabled={loading}
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 11, color: '#9ca3af', marginTop: 20 }}>
          WS POS — Sistema de Facturación Web
        </p>
      </div>
    </div>
  )
}
