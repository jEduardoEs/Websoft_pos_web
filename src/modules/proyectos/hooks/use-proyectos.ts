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
      setClienteSearch('')
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
    setClienteSearch('')
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
    setClienteSearch('')
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
  const [ventasList, setVentasList] = useState<any[]>([])
  const [clientesList, setClientesList] = useState<any[]>([])
  const [clienteSearch, setClienteSearch] = useState('')

  useEffect(() => {
    if (showModal) {
      setClienteSearch('')
      fetch('/api/cotizaciones')
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setCotizacionesList(data) })
        .catch(() => {})

      fetch('/api/ventas')
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setVentasList(data) })
        .catch(() => {})

      fetch('/api/clientes')
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setClientesList(data) })
        .catch(() => {})
    }
  }, [showModal])

  const term = clienteSearch.trim().toLowerCase()

  const asociados = term.length >= 2
    ? [
        ...cotizacionesList.filter(c => 
          (c.clienteNombre && c.clienteNombre.toLowerCase().includes(term)) ||
          (c.clienteNit && c.clienteNit.toLowerCase().includes(term) && c.clienteNit !== 'CF') ||
          (c.numero && c.numero.toLowerCase().includes(term))
        ).map(c => {
          const hasInstalacion = (c.items || []).some((i: any) => 
            (i.nombre && i.nombre.toLowerCase().includes('instalac')) || 
            (i.descripcion && i.descripcion.toLowerCase().includes('instalac'))
          )
          return {
            tipo: 'cotizacion' as const,
            id: c.id,
            numero: c.numero,
            clienteNombre: c.clienteNombre,
            clienteNit: c.clienteNit,
            clienteTelefono: c.clienteTelefono,
            clienteDireccion: c.clienteDireccion,
            total: c.total,
            hasInstalacion,
            itemsText: c.items && c.items.length > 0 ? c.items.map((i: any) => `${i.cantidad}x ${i.descripcion || i.nombre}`).join(', ') : c.descripcion || '',
            data: c,
          }
        }),
        ...ventasList.filter(v => 
          (v.clienteNombre && v.clienteNombre.toLowerCase().includes(term)) ||
          (v.clienteNit && v.clienteNit.toLowerCase().includes(term) && v.clienteNit !== 'CF') ||
          (v.numero && v.numero.toLowerCase().includes(term))
        ).map(v => {
          const hasInstalacion = (v.items || []).some((i: any) => 
            (i.nombre && i.nombre.toLowerCase().includes('instalac')) || 
            (i.descripcion && i.descripcion.toLowerCase().includes('instalac')) ||
            (i.categoria && i.categoria.toLowerCase().includes('servicio'))
          )
          return {
            tipo: 'venta' as const,
            id: v.id,
            numero: v.numero,
            clienteNombre: v.clienteNombre,
            clienteNit: v.clienteNit,
            clienteTelefono: v.clienteTelefono,
            clienteDireccion: v.clienteDireccion,
            total: v.total,
            hasInstalacion,
            itemsText: v.items && v.items.length > 0 ? v.items.map((i: any) => `${i.cantidad}x ${i.nombre || i.descripcion}`).join(', ') : v.notas || '',
            data: v,
          }
        })
      ]
    : []

  const seleccionarAsociado = (item: any) => {
    if (!item) return
    setClienteSearch('')
    setForm(prev => ({
      ...prev,
      clienteNombre: item.clienteNombre || prev.clienteNombre,
      clienteNit: item.clienteNit || prev.clienteNit || 'CF',
      clienteTelefono: item.clienteTelefono || prev.clienteTelefono || '',
      clienteDireccion: item.clienteDireccion || prev.clienteDireccion || '',
      cotizacionNumero: item.numero,
      descripcion: item.itemsText || `Instalación / Trabajo para ${item.clienteNombre}`,
      nombre: `Proyecto ${item.clienteNombre} (${item.numero})`,
    }))
    const labelTipo = item.tipo === 'cotizacion' ? 'Cotización' : 'Venta'
    toast.success(`Datos cargados desde ${labelTipo} ${item.numero}${item.hasInstalacion ? ' (con instalación incluida)' : ''}`)
  }

  const cargarDesdeCotizacion = async (cotNumero: string) => {
    setClienteSearch('')
    if (!cotNumero || !cotNumero.trim()) {
      toast.error('Ingresa un número de cotización o venta vinculada')
      return
    }

    let cList = cotizacionesList
    let vList = ventasList

    if (!cList || cList.length === 0) {
      try {
        const res = await fetch('/api/cotizaciones')
        const data = await res.json()
        if (Array.isArray(data)) {
          cList = data
          setCotizacionesList(data)
        }
      } catch (err) {}
    }

    if (!vList || vList.length === 0) {
      try {
        const res = await fetch('/api/ventas')
        const data = await res.json()
        if (Array.isArray(data)) {
          vList = data
          setVentasList(data)
        }
      } catch (err) {}
    }

    const t = cotNumero.trim().toLowerCase()
    const cleanNum = t.replace(/\D/g, '')

    const cot = cList.find(c => {
      if (!c) return false
      const numStr = (c.numero || '').toLowerCase()
      if (numStr === t) return true
      if (t.includes('cot') && cleanNum.length > 0 && numStr.includes(cleanNum)) return true
      if (String(c.id) === t || (cleanNum.length > 0 && String(c.id) === cleanNum)) return true
      if (cleanNum.length > 0 && numStr.endsWith(cleanNum)) return true
      return false
    })

    const venta = vList.find(v => {
      if (!v) return false
      const numStr = (v.numero || '').toLowerCase()
      if (numStr === t) return true
      if ((t.includes('fac') || t.includes('ven')) && cleanNum.length > 0 && numStr.includes(cleanNum)) return true
      if (String(v.id) === t || (cleanNum.length > 0 && String(v.id) === cleanNum)) return true
      if (cleanNum.length > 0 && numStr.endsWith(cleanNum)) return true
      return false
    })

    if (cot) {
      const itemsText = cot.items && cot.items.length > 0
        ? cot.items.map((i: any) => `${i.cantidad}x ${i.descripcion || i.nombre}`).join(', ')
        : cot.descripcion || ''

      const hasInstalacion = (cot.items || []).some((i: any) => 
        (i.nombre && i.nombre.toLowerCase().includes('instalac')) || 
        (i.descripcion && i.descripcion.toLowerCase().includes('instalac'))
      )

      setForm(prev => ({
        ...prev,
        cotizacionNumero: cot.numero,
        clienteNombre: cot.clienteNombre || prev.clienteNombre,
        clienteNit: cot.clienteNit || prev.clienteNit || 'CF',
        clienteTelefono: cot.clienteTelefono || prev.clienteTelefono || '',
        clienteDireccion: cot.clienteDireccion || prev.clienteDireccion || '',
        contactoNombre: cot.atencion || prev.contactoNombre || '',
        descripcion: itemsText || prev.descripcion,
        nombre: prev.nombre || `Proyecto ${cot.clienteNombre} (${cot.numero})`,
      }))
      toast.success(hasInstalacion ? `Cotización ${cot.numero} (con instalación) cargada` : `Cotización ${cot.numero} cargada`)
      return
    }

    if (venta) {
      const itemsText = venta.items && venta.items.length > 0
        ? venta.items.map((i: any) => `${i.cantidad}x ${i.nombre || i.descripcion}`).join(', ')
        : venta.notas || ''

      const hasInstalacion = (venta.items || []).some((i: any) => 
        (i.nombre && i.nombre.toLowerCase().includes('instalac')) || 
        (i.descripcion && i.descripcion.toLowerCase().includes('instalac')) ||
        (i.categoria && i.categoria.toLowerCase().includes('servicio'))
      )

      setForm(prev => ({
        ...prev,
        cotizacionNumero: venta.numero,
        clienteNombre: venta.clienteNombre || prev.clienteNombre,
        clienteNit: venta.clienteNit || prev.clienteNit || 'CF',
        clienteTelefono: venta.clienteTelefono || prev.clienteTelefono || '',
        clienteDireccion: venta.clienteDireccion || prev.clienteDireccion || '',
        descripcion: itemsText || prev.descripcion,
        nombre: prev.nombre || `Proyecto ${venta.clienteNombre} (${venta.numero})`,
      }))
      toast.success(hasInstalacion ? `Venta libre ${venta.numero} (con instalación) cargada` : `Venta ${venta.numero} cargada`)
      return
    }

    toast.error(`No se encontró cotización o venta "${cotNumero}"`)
  }

  const cargarDesdeCliente = async (val: string) => {
    setClienteSearch('')
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

    const t = val.trim().toLowerCase()
    const cli = cList.find(c => 
      (c.nombre && c.nombre.toLowerCase().includes(t)) ||
      (c.nit && c.nit.toLowerCase().includes(t) && c.nit !== 'CF')
    )

    const cotAssoc = cotizacionesList.find(c => 
      (c.clienteNombre && c.clienteNombre.toLowerCase().includes(t)) ||
      (c.clienteNit && c.clienteNit.toLowerCase().includes(t) && c.clienteNit !== 'CF')
    )

    const ventaAssoc = ventasList.find(v =>
      (v.clienteNombre && v.clienteNombre.toLowerCase().includes(t)) ||
      (v.clienteNit && v.clienteNit.toLowerCase().includes(t) && v.clienteNit !== 'CF')
    )

    const assocDoc = cotAssoc || ventaAssoc

    if (cli || assocDoc) {
      const nombreFinal = cli?.nombre || assocDoc?.clienteNombre || val
      const nitFinal = cli?.nit || assocDoc?.clienteNit || 'CF'
      const telFinal = cli?.telefono || assocDoc?.clienteTelefono || ''
      const dirFinal = cli?.direccion || assocDoc?.clienteDireccion || ''
      
      let itemsText = ''
      let docNum = ''

      if (cotAssoc) {
        docNum = cotAssoc.numero
        itemsText = cotAssoc.items && cotAssoc.items.length > 0
          ? cotAssoc.items.map((i: any) => `${i.cantidad}x ${i.descripcion || i.nombre}`).join(', ')
          : cotAssoc.descripcion || ''
      } else if (ventaAssoc) {
        docNum = ventaAssoc.numero
        itemsText = ventaAssoc.items && ventaAssoc.items.length > 0
          ? ventaAssoc.items.map((i: any) => `${i.cantidad}x ${i.nombre || i.descripcion}`).join(', ')
          : ventaAssoc.notas || ''
      }

      setForm(prev => ({
        ...prev,
        clienteNombre: nombreFinal,
        clienteNit: nitFinal,
        clienteTelefono: telFinal || prev.clienteTelefono || '',
        clienteDireccion: dirFinal || prev.clienteDireccion || '',
        cotizacionNumero: docNum || prev.cotizacionNumero || '',
        descripcion: itemsText || prev.descripcion || '',
        nombre: prev.nombre || `Proyecto ${nombreFinal}${docNum ? ` (${docNum})` : ''}`,
      }))
      toast.success(`Datos del cliente ${nombreFinal} cargados`)
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
      ventasList,
      clientesList,
      clienteSearch,
      asociados
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
      setClienteSearch,
      seleccionarAsociado,
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
