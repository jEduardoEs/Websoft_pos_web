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
      toast.error('Usuario o contrasena incorrectos')
    } else {
      router.push('/pos')
      router.refresh()
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'linear-gradient(135deg, #020917 0%, #0a1628 40%, #0f1f3d 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    }}>
      {/* Background glow effects */}
      <div style={{ position: 'absolute', top: '20%', left: '30%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(37,99,235,.12) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '10%', right: '20%', width: 300, height: 300, background: 'radial-gradient(circle, rgba(29,78,216,.08) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

      <div style={{
        background: 'rgba(15,31,61,.85)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(37,99,235,.2)',
        borderRadius: 18,
        padding: '40px 38px',
        width: 380,
        boxShadow: '0 30px 80px rgba(0,0,0,.5), 0 0 40px rgba(37,99,235,.08)',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <img
              src="https://websoft-solutions.vercel.app/logo.png"
              alt="WebSoft"
              style={{ width: 64, height: 64, borderRadius: 14, objectFit: 'contain', display: 'block' }}
              onError={e => {
                const el = e.target as HTMLImageElement
                el.style.display = 'none'
                const next = el.nextElementSibling as HTMLElement
                if (next) next.style.display = 'flex'
              }}
            />
            {/* Fallback logo */}
            <div style={{ width: 64, height: 64, borderRadius: 14, background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', display: 'none', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: '#fff' }}>W</div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: -.5, lineHeight: 1 }}>
            Web<span style={{ color: '#2563eb' }}>Soft</span>
          </div>
          <div style={{ fontSize: 10, color: '#60a5fa', letterSpacing: 3, fontWeight: 600, marginTop: 4 }}>SOLUTIONS</div>
          <div style={{ fontSize: 12, color: 'rgba(148,163,184,.6)', marginTop: 10 }}>Sistema de Gestion</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#60a5fa', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
              Usuario
            </label>
            <input
              className="input"
              type="text"
              value={form.usuario}
              onChange={e => setForm(f => ({ ...f, usuario: e.target.value }))}
              placeholder="Ingresa tu usuario"
              required
              autoFocus
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#60a5fa', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
              Contrasena
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
            style={{ width: '100%', padding: '13px', fontSize: 15, borderRadius: 10 }}
            disabled={loading}
          >
            {loading ? 'Ingresando...' : 'Ingresar al sistema'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: 'rgba(100,116,139,.5)' }}>
          WebSoft Solutions · Guastatoya, El Progreso
        </div>
      </div>
    </div>
  )
}
