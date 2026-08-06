import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { AuthService } from '../services/auth.service'

export function useAuth() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const errorParam = searchParams.get('error')
  
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ usuario: '', password: '' })
  const [sessionError, setSessionError] = useState(errorParam === 'CredentialsSignin' || errorParam?.includes('SESION_ACTIVA'))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSessionError(false)
    setLoading(true)
    
    try {
      const res = await AuthService.login(form)
      setLoading(false)
      
      if (res?.error) {
        if (res.error.includes('SESION_ACTIVA') || res.error === 'CredentialsSignin') {
          setSessionError(true)
        } else {
          toast.error(`Error de login: ${res.error}`)
        }
      } else if (res?.ok) {
        toast.success('Login exitoso, redirigiendo...')
        router.push('/dashboard')
        router.refresh()
      } else {
        toast.error('Ocurrió un problema inesperado al iniciar sesión.')
      }
    } catch (err: any) {
      setLoading(false)
      toast.error(err.message || 'Error de conexión')
    }
  }

  return {
    state: {
      form,
      loading,
      sessionError
    },
    actions: {
      setForm,
      handleSubmit
    }
  }
}
