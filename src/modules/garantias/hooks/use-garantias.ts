import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import { GarantiasService, Garantia, Reclamo } from '../services/garantias.service'
import { printGarantia, printReclamo } from '../utils/pdfGenerators'

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
  const [tab, setTab] = useState<'garantias'|'reclamos'>('garantias')

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
      if (garantiaId) setReclamos(data)
      else setTodosReclamos(data)
    } catch {
      toast.error('Error al cargar reclamos')
    }
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => { if (tab === 'reclamos') loadReclamos() }, [tab, loadReclamos])
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

  return {
    state: {
      garantias, buscar, filtroEstado, showModal, showReclamo, selectedGarantia,
      reclamos, todosReclamos, form, reclamoForm, loading, ventas, tab
    },
    actions: {
      setBuscar, setFiltroEstado, setShowModal, setShowReclamo, setTab,
      setForm, setF, setRF, selVenta,
      saveGarantia, abrirReclamo, saveReclamo, resolverReclamo,
      emptyForm
    }
  }
}
