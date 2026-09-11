'use client'
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { descuentosService } from '../services/descuentosService'
import { DescuentoResponseDTO, CrearDescuentoDTO } from '../dto/DescuentoDTO'
import { DescuentoFormState } from '../types'

const emptyForm: DescuentoFormState = {
  id: 0,
  codigo: '',
  descripcion: '',
  tipo: 'porcentaje',
  valor: '',
  minimoCompra: '',
  usosMaximos: '0',
  fechaInicio: '',
  fechaFin: '',
}

export function useDescuentos() {
  const [descuentos, setDescuentos] = useState<DescuentoResponseDTO[]>([])
  const [showModal, setShowModal] = useState<boolean>(false)
  const [form, setForm] = useState<DescuentoFormState>(emptyForm)
  const [loading, setLoading] = useState<boolean>(false)

  const load = useCallback(async () => {
    const list = await descuentosService.obtenerTodos()
    setDescuentos(list)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const openNew = useCallback(() => {
    setForm(emptyForm)
    setShowModal(true)
  }, [])

  const closeModal = useCallback(() => {
    setShowModal(false)
  }, [])

  const save = useCallback(async () => {
    if (!form.codigo || !form.valor) {
      toast.error('Código y valor son requeridos')
      return
    }

    setLoading(true)
    const dto: CrearDescuentoDTO = {
      id: form.id > 0 ? form.id : undefined,
      codigo: form.codigo,
      descripcion: form.descripcion || null,
      tipo: form.tipo,
      valor: Number(form.valor) || 0,
      minimoCompra: Number(form.minimoCompra) || 0,
      usosMaximos: Number(form.usosMaximos) || 0,
      fechaInicio: form.fechaInicio || null,
      fechaFin: form.fechaFin || null,
    }

    const success = await descuentosService.guardar(dto)
    setLoading(false)

    if (success) {
      toast.success('Guardado')
      setShowModal(false)
      load()
    } else {
      toast.error('Error al guardar el descuento')
    }
  }, [form, load])

  const desactivar = useCallback(
    async (d: DescuentoResponseDTO) => {
      const success = await descuentosService.toggleActivo(d.id, false)
      if (success) {
        toast.success(`Código "${d.codigo}" desactivado`)
        load()
      } else {
        toast.error('Error al desactivar código')
      }
    },
    [load]
  )

  const activar = useCallback(
    async (d: DescuentoResponseDTO) => {
      const success = await descuentosService.toggleActivo(d.id, true)
      if (success) {
        toast.success(`Código "${d.codigo}" activado`)
        load()
      } else {
        toast.error('Error al activar código')
      }
    },
    [load]
  )

  const eliminar = useCallback(
    async (d: DescuentoResponseDTO) => {
      if (!confirm(`¿Eliminar permanentemente el código de descuento "${d.codigo}"?`)) return
      const success = await descuentosService.eliminar(d.id)
      if (success) {
        toast.success('Descuento eliminado')
        load()
      } else {
        toast.error('Error al eliminar el descuento')
      }
    },
    [load]
  )

  return {
    descuentos,
    showModal,
    form,
    loading,
    setForm,
    openNew,
    closeModal,
    save,
    del: desactivar,
    desactivar,
    activar,
    eliminar,
    refresh: load,
  }
}
