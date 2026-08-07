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

  const [showFacturaModal, setShowFacturaModal] = useState(false)
  const [facturaForm, setFacturaForm] = useState<any>({
    clienteNombre: '',
    clienteNit: 'CF',
    clienteCorreo: '',
    clienteTelefono: '',
    clienteDireccion: '',
    metodoPago: 'efectivo',
    montoTotal: '',
    diasGarantia: '365',
    productoSerie: '',
    notas: '',
  })

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

  const abrirFacturacion = () => {
    if (!proyecto) return
    const cotiz = (proyecto as any).cotizacion
    const monto = cotiz?.total || (proyecto as any).montoTotal || ''
    setFacturaForm({
      clienteNombre: cotiz?.clienteNombre || proyecto.clienteNombre || '',
      clienteNit: cotiz?.clienteNit || proyecto.clienteNit || 'CF',
      clienteCorreo: cotiz?.clienteCorreo || '',
      clienteTelefono: cotiz?.clienteTelefono || proyecto.clienteTelefono || '',
      clienteDireccion: cotiz?.clienteDireccion || proyecto.clienteDireccion || '',
      metodoPago: cotiz?.metodoPago || 'efectivo',
      montoTotal: monto ? String(monto) : '',
      diasGarantia: '365',
      productoSerie: '',
      notas: `Factura de proyecto ${proyecto.numero}`,
    })
    setShowFacturaModal(true)
  }

  const facturarYCompletar = async () => {
    if (!facturaForm.clienteNombre || !facturaForm.montoTotal || Number(facturaForm.montoTotal) <= 0) {
      toast.error('Nombre del cliente y monto total son requeridos')
      return
    }
    setLoading(true)
    try {
      const data = await ProyectosService.facturarProyecto(id, facturaForm)
      setLoading(false)
      if (data.ok) {
        toast.success(`Factura ${data.venta?.numero || ''} emitida y garantía activada`)
        if (data.emailSent) {
          toast.success(`Factura enviada por correo a ${facturaForm.clienteCorreo}`)
        }
        setShowFacturaModal(false)
        load()
      } else {
        toast.error(data.error || 'Error al facturar el proyecto')
      }
    } catch {
      setLoading(false)
      toast.error('Error al facturar el proyecto')
    }
  }

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

  const [showPinFaseModal, setShowPinFaseModal] = useState(false)
  const [faseDestino, setFaseDestino] = useState('')
  const [pinInput, setPinInput] = useState('')

  const FASE_INDEX: Record<string, number> = { planificado: 0, en_ejecucion: 1, completado: 2 }

  const cambiarEstado = async (nuevoEstado: string, pin?: string) => {
    if (!proyecto) return
    const actualIdx = FASE_INDEX[proyecto.estado] ?? 0
    const nuevoIdx = FASE_INDEX[nuevoEstado] ?? 0

    if (nuevoIdx < actualIdx && !pin) {
      setFaseDestino(nuevoEstado)
      setShowPinFaseModal(true)
      return
    }

    setLoading(true)
    const data = await ProyectosService.updateProyecto(id, { estado: nuevoEstado }, pin || pinInput)
    setLoading(false)
    if (data.ok) { 
      toast.success(`Fase actualizada`)
      setShowPinFaseModal(false)
      setPinInput('')
      setFaseDestino('')
      load() 
    } else {
      toast.error(data.error || 'Error al actualizar fase')
    }
  }

  const diasPara = (fecha: string) => Math.ceil((new Date(fecha).getTime() - Date.now()) / 86400000)

  return {
    state: {
      proyecto,
      editando,
      editForm,
      showMarcar,
      showFacturaModal,
      showPinFaseModal,
      faseDestino,
      pinInput,
      facturaForm,
      mantForm,
      loading,
      mantImagenes
    },
    actions: {
      setEditando,
      setEditForm,
      setShowMarcar,
      setShowFacturaModal,
      setShowPinFaseModal,
      setPinInput,
      setFacturaForm,
      abrirFacturacion,
      facturarYCompletar,
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
