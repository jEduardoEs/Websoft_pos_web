'use client'
import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'

function LoginFormContent() {
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
    <main style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#eff6ff 0%,#f0f4f8 50%,#e0f2fe 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ position: 'absolute', top: '10%', right: '15%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle,rgba(37,99,235,.08) 0%,transparent 70%)', pointerEvents: 'none' }} />
      <section aria-labelledby="login-title" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '40px 38px', width: 390, boxShadow: '0 4px 24px rgba(37,99,235,.1)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
          <img src="https://websoftsolutions.com.gt/logo.png" alt="Logo de WebSoft Solutions"
            loading="lazy" decoding="async"
            style={{ width: 60, height: 60, borderRadius: 12, objectFit: 'contain', marginBottom: 12 }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          <h1 id="login-title" style={{ display: 'flex', alignItems: 'center', fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>
            <span>Web</span>
            <span style={{ color: '#2563eb' }}>Soft</span>
            <span style={{ color: '#0f172a', marginLeft: 5 }}>Solutions</span>
          </h1>
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 4, marginBottom: 0 }}>Sistema de Gestion · Guastatoya</p>
        </div>

        {sessionError && (
          <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: 10, padding: 14, marginBottom: 18 }} role="alert">
            <div style={{ fontWeight: 700, fontSize: 13, color: '#dc2626', marginBottom: 6 }}>
              ⚠ Sesion activa en otro dispositivo
            </div>
            <div style={{ fontSize: 12, color: '#7f1d1d', lineHeight: 1.5 }}>
              Este usuario ya tiene una sesion activa en otro equipo. Contacta al administrador para cerrar la sesion remota, o espera a que expire automaticamente (8 horas).
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ marginBottom: 14 }}>
            <label htmlFor="usuario" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Usuario</label>
            <input id="usuario" className="input" type="text" value={form.usuario} onChange={e => setForm(f => ({ ...f, usuario: e.target.value }))} placeholder="Ingresa tu usuario" required autoFocus autoComplete="username" />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label htmlFor="password" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Contrasena</label>
            <input id="password" className="input" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" required autoComplete="current-password" />
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%', padding: '12px', fontSize: 15, borderRadius: 10 }} disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar al sistema'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: '#cbd5e1' }}>
          Tecnologia y seguridad · Guastatoya, El Progreso
        </p>
      </section>
    </main>
  )
}

export default function LoginForm() {
  return (
    <Suspense>
      <LoginFormContent />
    </Suspense>
  )
}
