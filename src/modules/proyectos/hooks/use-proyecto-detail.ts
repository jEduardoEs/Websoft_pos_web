import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ProyectosService, Proyecto, Mant } from '../services/proyectos.service'

export function useProyectoDetail(id: string) {
  const router = useRouter()
  const [proyecto, setProyecto] = useState<Proyecto | null>(null)
  const [editando, setEditando] = useState(false)
  const [editForm, setEditForm] = useState<any>({})
  const [showMarcar, setShowMarcar] = useState<Mant | null>(null)
  const [mantForm, setMantForm] = useState({ fechaRealizada: new Date().toISOString().split('T')[0], notas: '', cobrado: false, montoCobrado: '', tecnicoNombre: '' })
  const [loading, setLoading] = useState(false)
  const [mantImagenes, setMantImagenes] = useState<string[]>([])

  const load = useCallback(async () => {
    const data = await ProyectosService.getProyecto(id)
    if (!data) { 
      router.push('/proyectos')
      return 
    }
    setProyecto(data)
    setEditForm({
      nombre: data.nombre, clienteNombre: data.clienteNombre, clienteTelefono: data.clienteTelefono || '',
      clienteDireccion: data.clienteDireccion || '', clienteNit: data.clienteNit || '',
      contactoNombre: data.contactoNombre || '', descripcion: data.descripcion,
      alcance: data.alcance || '', notas: data.notas || '', estado: data.estado,
      fechaInicio: data.fechaInicio ? data.fechaInicio.split('T')[0] : '',
    })
  }, [id, router])

  useEffect(() => { load() }, [load])

  const guardarEdicion = async () => {
    setLoading(true)
    const data = await ProyectosService.updateProyecto(id, editForm)
    setLoading(false)
    if (data.ok) { 
      toast.success('Proyecto actualizado')
      setEditando(false)
      load() 
    } else {
      toast.error(data.error)
    }
  }

  const marcarRealizado = async () => {
    if (!showMarcar) return
    setLoading(true)
    const data = await ProyectosService.marcarMantenimiento(id, showMarcar.id, {
      ...mantForm,
      montoCobrado: mantForm.montoCobrado ? Number(mantForm.montoCobrado) : 0,
      imagenes: mantImagenes
    })
    setLoading(false)
    if (data.ok) { 
      toast.success(`Mantenimiento ${showMarcar.numero} marcado como realizado`)
      setShowMarcar(null)
      setMantImagenes([])
      load() 
    } else {
      toast.error(data.error)
    }
  }

  const cambiarEstado = async (estado: string) => {
    const data = await ProyectosService.updateProyecto(id, { estado })
    if (data.ok) { 
      toast.success(`Estado actualizado`)
      load() 
    }
  }

  const diasPara = (fecha: string) => Math.ceil((new Date(fecha).getTime() - Date.now()) / 86400000)

  return {
    state: {
      proyecto,
      editando,
      editForm,
      showMarcar,
      mantForm,
      loading,
      mantImagenes
    },
    actions: {
      setEditando,
      setEditForm,
      setShowMarcar,
      setMantForm,
      setMantImagenes,
      guardarEdicion,
      marcarRealizado,
      cambiarEstado
    },
    utils: {
      diasPara
    }
  }
}
