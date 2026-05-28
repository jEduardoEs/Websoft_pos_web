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
      background: 'linear-gradient(135deg, #eff6ff 0%, #f0f4f8 50%, #e0f2fe 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Decorative circles like the website */}
      <div style={{ position: 'absolute', top: '10%', right: '15%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '15%', left: '10%', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 16,
        padding: '40px 38px',
        width: 380,
        boxShadow: '0 4px 24px rgba(37,99,235,.1), 0 1px 4px rgba(0,0,0,.06)',
      }}>
        {/* Logo — exact style of website */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
          <img
            src="https://websoft-solutions.vercel.app/logo.png"
            alt="WebSoft Solutions"
            style={{ width: 60, height: 60, borderRadius: 12, objectFit: 'contain', marginBottom: 12 }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 4 }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: '#0f172a' }}>Web</span>
            <span style={{ fontSize: 22, fontWeight: 700, color: '#2563eb' }}>Soft</span>
            <span style={{ fontSize: 22, fontWeight: 400, color: '#0f172a', marginLeft: 5 }}>Solutions</span>
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Sistema de Gestion · Guastatoya</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
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
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
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
            style={{ width: '100%', padding: '12px', fontSize: 15, borderRadius: 10 }}
            disabled={loading}
          >
            {loading ? 'Ingresando...' : 'Ingresar al sistema'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: '#cbd5e1' }}>
          Tecnologia y seguridad · Guastatoya, El Progreso
        </div>
      </div>
    </div>
  )
}
