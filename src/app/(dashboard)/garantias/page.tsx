import { Metadata } from 'next'
import GarantiasModule from '@/modules/garantias/components/GarantiasModule'

export const metadata: Metadata = {
  title: 'Garantías - WebSoft POS',
  description: 'Gestión de certificados y reclamos de garantías',
}

export default function GarantiasPage() {
  return <GarantiasModule />
}
