'use client'
import ProyectoDetailModule from '@/modules/proyectos/components/ProyectoDetailModule'

export default function ProyectoDetallePage({ params }: { params: { id: string } }) {
  return <ProyectoDetailModule id={params.id} />
}
