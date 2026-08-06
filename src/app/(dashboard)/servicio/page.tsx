import { Metadata } from 'next'
import ServicioModule from '@/modules/servicio/components/ServicioModule'

export const metadata: Metadata = {
  title: 'Servicio Técnico - WebSoft POS',
  description: 'Gestión de órdenes de trabajo y reparaciones',
}

export default function ServicioPage() {
  return <ServicioModule />
}
