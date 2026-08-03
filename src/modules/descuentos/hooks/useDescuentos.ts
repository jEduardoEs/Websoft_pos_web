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

  const del = useCallback(
    async (d: DescuentoResponseDTO) => {
      if (!confirm(`¿Desactivar código "${d.codigo}"?`)) return
      const success = await descuentosService.desactivar(d.id)
      if (success) {
        toast.success('Desactivado')
        load()
      } else {
        toast.error('Error al desactivar')
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
    del,
    refresh: load,
  }
}
