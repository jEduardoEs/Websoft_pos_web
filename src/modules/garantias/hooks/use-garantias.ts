import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import { GarantiasService, Garantia, Reclamo } from '../services/garantias.service'
import { printGarantia, printReclamo } from '../utils/pdfGenerators'
import { useSession } from 'next-auth/react'

const emptyForm = {
  clienteNombre: '', clienteTelefono: '', clienteNit: 'CF',
  productoNombre: '', productoSerie: '', ventaNumero: '',
  diasGarantia: '365', fechaVenta: new Date().toISOString().slice(0, 10),
  condiciones: 'Daños físicos anulan la garantía. Se atiende en instalaciones de WebSoft Solutions.',
  notas: '',
}

const emptyReclamo = {
  motivoReclamo: '', descripcionFalla: '', clienteNit: '',
  clienteDpi: '', clienteTelefono: '', tieneFactura: false,
  numeroFactura: '', notas: '',
}

export function useGarantias() {
  const [garantias, setGarantias] = useState<Garantia[]>([])
  const [buscar, setBuscar] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showReclamo, setShowReclamo] = useState(false)
  const [selectedGarantia, setSelectedGarantia] = useState<Garantia | null>(null)
  const [reclamos, setReclamos] = useState<Reclamo[]>([])
  const [todosReclamos, setTodosReclamos] = useState<Reclamo[]>([])
  const [form, setForm] = useState(emptyForm)
  const [reclamoForm, setReclamoForm] = useState(emptyReclamo)
  const [loading, setLoading] = useState(false)
  const [ventas, setVentas] = useState<any[]>([])
  const [tab, setTab] = useState<'todas' | 'vigente' | 'reclamada' | 'vencida' | 'anulada'>('todas')

  const load = useCallback(async () => {
    try {
      const data = await GarantiasService.getGarantias(buscar, filtroEstado)
      setGarantias(data)
    } catch {
      toast.error('Error al cargar garantías')
    }
  }, [buscar, filtroEstado])

  const loadReclamos = useCallback(async (garantiaId?: number) => {
    try {
      const data = await GarantiasService.getReclamos(garantiaId)
      const list = Array.isArray(data) ? data : []
      if (garantiaId) setReclamos(list)
      else setTodosReclamos(list)
    } catch (e) {
      console.error('loadReclamos error', e)
      toast.error('Error al cargar reclamos')
    }
  }, [])

  useEffect(() => {
    load()
    loadReclamos()
  }, [load, loadReclamos])

  useEffect(() => {
    if (tab === 'reclamada') {
      loadReclamos()
    } else {
      load()
    }
  }, [tab, load, loadReclamos])

  useEffect(() => {
    GarantiasService.getVentas().then(setVentas).catch(() => {})
  }, [])

  const setF = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))
  const setRF = (k: string, v: any) => setReclamoForm(p => ({ ...p, [k]: v }))

  const selVenta = (ventaId: string) => {
    const v = ventas.find((x: any) => x.id === Number(ventaId))
    if (!v) return
    setForm(p => ({
      ...p, ventaNumero: v.numero, clienteNombre: v.clienteNombre,
      clienteNit: v.clienteNit, fechaVenta: new Date(v.fecha).toISOString().slice(0, 10),
      productoNombre: v.items?.[0]?.nombre || '',
    }))
  }

  const saveGarantia = async () => {
    if (!form.clienteNombre || !form.productoNombre) { toast.error('Cliente y producto requeridos'); return }
    setLoading(true)
    try {
      const data = await GarantiasService.createGarantia(form)
      setLoading(false)
      if (data.ok) {
        toast.success(`Garantía ${data.garantia.numero} creada`)
        setShowModal(false); setForm(emptyForm); load()
        printGarantia(data.garantia)
      } else toast.error(data.error || 'Error')
    } catch {
      setLoading(false)
      toast.error('Error al guardar garantía')
    }
  }

  const abrirReclamo = async (g: Garantia) => {
    setSelectedGarantia(g)
    setReclamoForm({ ...emptyReclamo, clienteNit: g.clienteNit || '', clienteTelefono: g.clienteTelefono || '', numeroFactura: g.ventaNumero || '' })
    await loadReclamos(g.id)
    setShowReclamo(true)
  }

  const saveReclamo = async () => {
    if (!selectedGarantia) return
    if (!reclamoForm.motivoReclamo || !reclamoForm.descripcionFalla) {
      toast.error('Motivo y descripción son requeridos'); return
    }
    setLoading(true)
    try {
      const data = await GarantiasService.createReclamo({ garantiaId: selectedGarantia.id, ...reclamoForm })
      setLoading(false)
      if (data.ok) {
        toast.success(`Reclamo ${data.reclamo.numero} registrado`)
        setShowReclamo(false); load(); loadReclamos()
        printReclamo(data.reclamo, selectedGarantia)
      } else toast.error(data.error || 'Error')
    } catch {
      setLoading(false)
      toast.error('Error al guardar reclamo')
    }
  }

  const resolverReclamo = async (reclamo: Reclamo, decision: string, resolucion: string) => {
    const crearOrden = decision === 'reparar' && !reclamo.ordenTrabajoId
    try {
      const data = await GarantiasService.resolverReclamo(reclamo.id, { estado: 'resuelto', decision, resolucion, crearOrden })
      if (data.ok) {
        toast.success(crearOrden && data.ordenTrabajoId ? 'Resuelto — Orden de servicio creada automáticamente' : 'Reclamo resuelto')
        loadReclamos(); load()
      }
    } catch {
      toast.error('Error al resolver reclamo')
    }
  }

  const [showDetalle, setShowDetalle] = useState(false)

  const verDetalle = (g: Garantia) => {
    setSelectedGarantia(g)
    loadReclamos(g.id)
    setShowDetalle(true)
  }

  const anularGarantia = async (g: Garantia) => {
    if (!confirm(`¿Seguro que deseas anular la garantía "${g.numero}"?`)) return
    try {
      const data = await GarantiasService.anularGarantia(g.id)
      if (data.ok) {
        toast.success(`Garantía ${g.numero} anulada`)
        load()
      } else {
        toast.error(data.error || 'Error al anular la garantía')
      }
    } catch {
      toast.error('Error al anular la garantía')
    }
  }

  const changeTab = (t: 'todas' | 'vigente' | 'reclamada' | 'vencida' | 'anulada') => {
    setBuscar('')
    setFiltroEstado('')
    setTab(t)
  }

  return {
    state: {
      garantias, buscar, filtroEstado, showModal, showReclamo, showDetalle, selectedGarantia,
      reclamos, todosReclamos, form, reclamoForm, loading, ventas, tab
    },
    actions: {
      setBuscar, setFiltroEstado, setShowModal, setShowReclamo, setShowDetalle, setTab: changeTab,
      setForm, setF, setRF, selVenta, verDetalle,
      saveGarantia, abrirReclamo, saveReclamo, resolverReclamo, anularGarantia,
      emptyForm
    }
  }
}
