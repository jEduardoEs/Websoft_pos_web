import ConfiguracionModule from '@/modules/configuracion/components/ConfiguracionModule'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Configuración',
  description: 'Personaliza todos los aspectos del sistema POS.',
}

export default function ConfigPage() {
  return <ConfiguracionModule />
}
