import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import { ServicioService, Orden } from '../services/servicio.service'
import { printOrden } from '../utils/pdfGenerators'

export const ESTADOS = [
  { value: 'recibido',   label: 'Recibido',    color: '#8a887e', bg: '#f1f5f9' },
  { value: 'diagnostico', label: 'Diagnóstico', color: '#d97706', bg: '#fef3c7' },
  { value: 'en_proceso', label: 'En proceso',  color: '#1581E3', bg: '#eff6ff' },
  { value: 'listo',      label: 'Listo',       color: '#16a34a', bg: '#f0fdf4' },
  { value: 'entregado',  label: 'Entregado',   color: '#7c3aed', bg: '#f5f3ff' },
  { value: 'cancelado',  label: 'Cancelado',   color: '#dc2626', bg: '#fef2f2' },
]

const emptyForm = {
  clienteNombre: '', clienteTelefono: '', clienteNit: 'CF',
  tipoEquipo: '', marca: '', modelo: '', serie: '',
  accesorios: '', descripcionFalla: '', observaciones: '',
  prioridad: 'normal', fechaPromesa: '', tecnicoNombre: '',
  costoReparacion: '', costoRepuestos: '', notas: '',
}

export function useServicio() {
  const [ordenes, setOrdenes] = useState<Orden[]>([])
  const [filtroEstado, setFiltroEstado] = useState('')
  const [buscar, setBuscar] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showDetalle, setShowDetalle] = useState(false)
  const [selected, setSelected] = useState<Orden | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [repuestos, setRepuestos] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [comentarioCambio, setComentarioCambio] = useState('')

  const load = useCallback(async () => {
    try {
      const data = await ServicioService.getOrdenes(filtroEstado, buscar)
      setOrdenes(data)
    } catch {
      toast.error('Error al cargar órdenes')
    }
  }, [filtroEstado, buscar])

  useEffect(() => { load() }, [load])

  const setF = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const save = async () => {
    if (!form.clienteNombre || !form.tipoEquipo || !form.descripcionFalla) {
      toast.error('Cliente, equipo y falla son requeridos'); return
    }
    setLoading(true)
    try {
      const data = await ServicioService.createOrden({ ...form, repuestos })
      setLoading(false)
      if (data.ok) {
        toast.success(`Orden ${data.orden.numero} creada`)
        setShowModal(false); setForm(emptyForm); setRepuestos([]); load()
        printOrden(data.orden)
      } else toast.error(data.error || 'Error')
    } catch {
      setLoading(false)
      toast.error('Error al crear orden')
    }
  }

  const cambiarEstado = async (id: number, estado: string) => {
    setLoading(true)
    try {
      const data = await ServicioService.cambiarEstado(id, estado, comentarioCambio)
      setLoading(false)
      if (data.ok) {
        toast.success(`Estado: ${estado}`)
        setComentarioCambio(''); load()
        if (selected) {
          const r = await ServicioService.getOrdenById(id)
          setSelected(r)
        }
      } else toast.error(data.error || 'Error')
    } catch {
      setLoading(false)
      toast.error('Error al cambiar estado')
    }
  }

  return {
    state: {
      ordenes, filtroEstado, buscar, showModal, showDetalle, selected,
      form, repuestos, loading, comentarioCambio, emptyForm
    },
    actions: {
      setFiltroEstado, setBuscar, setShowModal, setShowDetalle, setSelected,
      setForm, setF, setRepuestos, setComentarioCambio,
      save, cambiarEstado, load
    }
  }
}
