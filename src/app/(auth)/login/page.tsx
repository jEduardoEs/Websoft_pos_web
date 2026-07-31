'use client'
import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ usuario: '', password: '' })
  const [sessionError, setSessionError] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSessionError(false)
    setLoading(true)
    const res = await signIn('credentials', { ...form, redirect: false })
    setLoading(false)
    if (res?.error) {
      if (res.error.includes('SESION_ACTIVA') || res.error === 'CredentialsSignin') {
        // Try to detect session error
        setSessionError(true)
      } else {
        toast.error('Usuario o contrasena incorrectos')
      }
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(135deg,#eff6ff 0%,#f0f4f8 50%,#e0f2fe 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', top: '10%', right: '15%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle,rgba(37,99,235,.08) 0%,transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '40px 38px', width: 390, boxShadow: '0 4px 24px rgba(37,99,235,.1)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
          <img src="https://websoftsolutions.com.gt/logo.png" alt="Logo"
            style={{ width: 60, height: 60, borderRadius: 12, objectFit: 'contain', marginBottom: 12 }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: '#0f172a' }}>Web</span>
            <span style={{ fontSize: 22, fontWeight: 700, color: '#2563eb' }}>Soft</span>
            <span style={{ fontSize: 22, fontWeight: 400, color: '#0f172a', marginLeft: 5 }}>Solutions</span>
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Sistema de Gestion · Guastatoya</div>
        </div>

        {/* Session blocked error */}
        {sessionError && (
          <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: 10, padding: 14, marginBottom: 18 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#dc2626', marginBottom: 6 }}>
              ⚠ Sesion activa en otro dispositivo
            </div>
            <div style={{ fontSize: 12, color: '#7f1d1d', lineHeight: 1.5 }}>
              Este usuario ya tiene una sesion activa en otro equipo. Contacta al administrador para cerrar la sesion remota, o espera a que expire automaticamente (8 horas).
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Usuario</label>
            <input className="input" type="text" value={form.usuario} onChange={e => setForm(f => ({ ...f, usuario: e.target.value }))} placeholder="Ingresa tu usuario" required autoFocus />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Contrasena</label>
            <input className="input" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" required />
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%', padding: '12px', fontSize: 15, borderRadius: 10 }} disabled={loading}>
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

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>
}
