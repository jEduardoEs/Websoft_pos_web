import { useState, useCallback, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { ProyectosService, Proyecto, Mant } from '../services/proyectos.service'

const emptyForm = { nombre: '', clienteNombre: '', clienteTelefono: '', clienteDireccion: '', clienteNit: '', contactoNombre: '', descripcion: '', alcance: '', cotizacionNumero: '', fechaInicio: new Date().toISOString().split('T')[0], notas: '' }

export function useProyectos(esAdminOSupervisor: boolean) {
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [openMenuId, setOpenMenuId] = useState<number | null>(null)
  const [showPinEliminar, setShowPinEliminar] = useState<number | null>(null)
  const [pinInput, setPinInput] = useState('')
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [alertas, setAlertas] = useState({ proximos: 0, vencidos: 0 })
  const [tab, setTab] = useState<'todos'|'planificado'|'en_ejecucion'|'completado'>('todos')
  const [buscar, setBuscar] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    try {
      const data = await ProyectosService.getProyectos(tab, buscar)
      setProyectos(data.proyectos || [])
      setAlertas({ proximos: data.proximos || 0, vencidos: data.vencidos || 0 })
    } catch (err) {
      toast.error('Error cargando proyectos')
    }
  }, [tab, buscar])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (menuRef.current && menuRef.current.contains(e.target as Node)) return
      setOpenMenuId(null)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const save = async () => {
    if (!form.nombre || !form.clienteNombre || !form.descripcion) { 
      toast.error('Nombre, cliente y descripción requeridos')
      return 
    }
    setLoading(true)
    const data = await ProyectosService.createProyecto(form)
    setLoading(false)
    
    if (data.ok) { 
      toast.success(`${data.proyecto.numero} creado — 3 mantenimientos programados`)
      setShowModal(false)
      setForm(emptyForm)
      load() 
    } else {
      toast.error(data.error || 'Error al crear proyecto')
    }
  }

  const eliminarProyecto = async (id: number, pin?: string) => {
    const data = await ProyectosService.deleteProyecto(id, pin)
    if (data.ok) { 
      toast.success('Proyecto eliminado')
      setShowPinEliminar(null)
      setPinInput('')
      load() 
    } else {
      toast.error(data.error || 'No autorizado')
    }
  }

  const handleEliminar = (id: number) => {
    setOpenMenuId(null)
    if (esAdminOSupervisor) {
      if (!confirm('¿Eliminar este proyecto? Esta acción no se puede deshacer.')) return
      eliminarProyecto(id)
    } else { 
      setShowPinEliminar(id)
      setPinInput('') 
    }
  }

  const diasPara = (fecha: string) => Math.ceil((new Date(fecha).getTime() - Date.now()) / 86400000)

  const getAlertaMant = (mantenimientos: Mant[]) => {
    const pendientes = mantenimientos.filter(m => !m.realizado)
    if (pendientes.length === 0) return null
    const next = pendientes[0]
    const dias = diasPara(next.fechaProgramada)
    if (dias < 0) return { tipo: 'vencido', dias: Math.abs(dias), num: next.numero }
    if (dias <= 15) return { tipo: 'proximo', dias, num: next.numero }
    return null
  }

  const setF = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  return {
    state: {
      proyectos,
      alertas,
      tab,
      buscar,
      showModal,
      form,
      loading,
      openMenuId,
      showPinEliminar,
      pinInput
    },
    actions: {
      setTab,
      setBuscar,
      setShowModal,
      setForm,
      setF,
      save,
      handleEliminar,
      eliminarProyecto,
      setPinInput,
      setShowPinEliminar,
      setOpenMenuId
    },
    utils: {
      diasPara,
      getAlertaMant
    },
    refs: {
      menuRef
    }
  }
}
