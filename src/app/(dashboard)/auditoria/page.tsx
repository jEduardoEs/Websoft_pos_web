import { Metadata } from 'next'
import AuditoriaModule from '@/modules/auditoria/components/AuditoriaModule'

export const metadata: Metadata = {
  title: 'Auditoría - WebSoft POS',
  description: 'Registro de acciones y bitácora del sistema',
}

export default function AuditoriaPage() {
  return <AuditoriaModule />
}
