import { PerfilModule } from '@/modules/perfil/components/PerfilModule';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mi Perfil | WebSoft POS',
};

export default function PerfilPage() {
  return <PerfilModule />;
}
