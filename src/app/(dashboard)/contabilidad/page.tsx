import { Metadata } from 'next';
import { ContabilidadDashboard } from '@/modules/contabilidad/components/ContabilidadDashboard';

export const metadata: Metadata = {
  title: 'Contabilidad | WebSoft POS',
  description: 'Módulo de Contabilidad',
};

export default function ContabilidadPage() {
  return <ContabilidadDashboard />;
}
