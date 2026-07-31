'use client'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import ZonasInstalacionTabView from '@/components/views/ZonasInstalacionTabView'

interface Zona {
  id: number
  nombre: string
  departamento: string
  tarifa: number
  notas: string | null
  activa: boolean
}

const emptyForm = { nombre: '', departamento: '', tarifa: '', notas: '' }

export default function ZonasInstalacionTabContainer() {
  const [zonas, setZonas] = useState<Zona[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch('/api/zonas-instalacion')
    const d = await res.json()
    setZonas(d.zonas || [])
  }, [])

  useEffect(() => { load() }, [load])

  const openNew = () => {
    setEditId(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  const openEdit = (z: Zona) => {
    setEditId(z.id)
    setForm({ nombre: z.nombre, departamento: z.departamento, tarifa: String(z.tarifa), notas: z.notas || '' })
    setShowModal(true)
  }

  const save = async () => {
    if (!form.nombre || !form.departamento) { toast.error('Nombre y departamento son requeridos'); return }
    setLoading(true)
    const res = editId
      ? await fetch(`/api/zonas-instalacion/${editId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      : await fetch('/api/zonas-instalacion', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const d = await res.json()
    setLoading(false)
    if (d.ok) { toast.success(editId ? 'Zona actualizada' : 'Zona creada'); setShowModal(false); load() }
    else toast.error(d.error || 'Error')
  }

  const toggleActiva = async (z: Zona) => {
    const res = await fetch(`/api/zonas-instalacion/${z.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ activa: !z.activa }) })
    if ((await res.json()).ok) { load() }
  }

  const eliminar = async (id: number) => {
    if (!confirm('¿Eliminar esta zona? Esta acción no se puede deshacer.')) return
    const res = await fetch(`/api/zonas-instalacion/${id}`, { method: 'DELETE' })
    if ((await res.json()).ok) { toast.success('Zona eliminada'); load() }
  }

  const handleChangeForm = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <ZonasInstalacionTabView
      zonas={zonas}
      showModal={showModal}
      editId={editId}
      form={form}
      loading={loading}
      onOpenNew={openNew}
      onOpenEdit={openEdit}
      onSave={save}
      onToggleActiva={toggleActiva}
      onEliminar={eliminar}
      onChangeForm={handleChangeForm}
      onCancel={() => setShowModal(false)}
    />
  )
}
