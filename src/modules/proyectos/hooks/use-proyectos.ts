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

  // Clear form automatically whenever modal is closed
  useEffect(() => {
    if (!showModal) {
      setForm({
        nombre: '',
        clienteNombre: '',
        clienteTelefono: '',
        clienteDireccion: '',
        clienteNit: '',
        contactoNombre: '',
        descripcion: '',
        alcance: '',
        cotizacionNumero: '',
        fechaInicio: new Date().toISOString().split('T')[0],
        notas: '',
      })
    }
  }, [showModal])

  const openModal = () => {
    setForm({
      nombre: '',
      clienteNombre: '',
      clienteTelefono: '',
      clienteDireccion: '',
      clienteNit: '',
      contactoNombre: '',
      descripcion: '',
      alcance: '',
      cotizacionNumero: '',
      fechaInicio: new Date().toISOString().split('T')[0],
      notas: '',
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setForm({
      nombre: '',
      clienteNombre: '',
      clienteTelefono: '',
      clienteDireccion: '',
      clienteNit: '',
      contactoNombre: '',
      descripcion: '',
      alcance: '',
      cotizacionNumero: '',
      fechaInicio: new Date().toISOString().split('T')[0],
      notas: '',
    })
  }

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
      closeModal()
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

  const [cotizacionesList, setCotizacionesList] = useState<any[]>([])
  const [clientesList, setClientesList] = useState<any[]>([])

  useEffect(() => {
    if (showModal) {
      fetch('/api/cotizaciones')
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setCotizacionesList(data) })
        .catch(() => {})

      fetch('/api/clientes')
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setClientesList(data) })
        .catch(() => {})
    }
  }, [showModal])

  const cargarDesdeCotizacion = async (cotNumero: string) => {
    if (!cotNumero || !cotNumero.trim()) {
      toast.error('Ingresa o selecciona un número de cotización')
      return
    }

    let list = cotizacionesList
    if (!list || list.length === 0) {
      try {
        const res = await fetch('/api/cotizaciones')
        const data = await res.json()
        if (Array.isArray(data)) {
          list = data
          setCotizacionesList(data)
        }
      } catch (err) {}
    }

    const term = cotNumero.trim().toLowerCase()
    const cleanNum = term.replace(/\D/g, '')

    const cot = list.find(c => {
      if (!c) return false
      const numStr = (c.numero || '').toLowerCase()
      if (numStr === term) return true
      if (term.includes('cot') && cleanNum.length > 0 && numStr.includes(cleanNum)) return true
      if (String(c.id) === term || (cleanNum.length > 0 && String(c.id) === cleanNum)) return true
      if (cleanNum.length > 0 && numStr.endsWith(cleanNum)) return true
      return false
    })

    if (cot) {
      const itemsText = cot.items && cot.items.length > 0
        ? cot.items.map((i: any) => `${i.cantidad}x ${i.descripcion || i.nombre}`).join(', ')
        : cot.descripcion || 'Instalación / Trabajo cotizado'

      setForm(prev => ({
        ...prev,
        cotizacionNumero: cot.numero,
        clienteNombre: cot.clienteNombre || prev.clienteNombre,
        clienteNit: cot.clienteNit || prev.clienteNit || 'CF',
        clienteTelefono: cot.clienteTelefono || prev.clienteTelefono || '',
        clienteDireccion: cot.clienteDireccion || prev.clienteDireccion || '',
        contactoNombre: cot.atencion || prev.contactoNombre || '',
        descripcion: itemsText,
        nombre: cot.descripcion || `Proyecto ${cot.clienteNombre} (${cot.numero})`,
      }))
      toast.success(`Datos cargados desde Cotización ${cot.numero}`)
    } else {
      toast.error(`No se encontró cotización "${cotNumero}"`)
    }
  }

  const cargarDesdeCliente = async (val: string) => {
    if (!val || !val.trim()) {
      toast.error('Ingresa el nombre o NIT del cliente')
      return
    }

    let cList = clientesList
    if (!cList || cList.length === 0) {
      try {
        const res = await fetch('/api/clientes')
        const data = await res.json()
        if (Array.isArray(data)) {
          cList = data
          setClientesList(data)
        }
      } catch (err) {}
    }

    const term = val.trim().toLowerCase()
    const cli = cList.find(c => 
      (c.nombre && c.nombre.toLowerCase().includes(term)) ||
      (c.nit && c.nit.toLowerCase().includes(term) && c.nit !== 'CF')
    )

    if (cli) {
      setForm(prev => ({
        ...prev,
        clienteNombre: cli.nombre || prev.clienteNombre,
        clienteNit: cli.nit || prev.clienteNit || 'CF',
        clienteTelefono: cli.telefono || prev.clienteTelefono || '',
        clienteDireccion: cli.direccion || prev.clienteDireccion || '',
      }))
      toast.success(`Datos personales del cliente ${cli.nombre} cargados`)
    } else {
      toast.error(`No se encontró cliente para "${val}"`)
    }
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
      pinInput,
      cotizacionesList,
      clientesList
    },
    actions: {
      setTab,
      setBuscar,
      setShowModal,
      openModal,
      closeModal,
      setForm,
      setF,
      save,
      handleEliminar,
      eliminarProyecto,
      setPinInput,
      setShowPinEliminar,
      setOpenMenuId,
      cargarDesdeCotizacion,
      cargarDesdeCliente
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
