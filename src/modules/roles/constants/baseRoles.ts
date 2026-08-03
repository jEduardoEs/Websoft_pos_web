import { RolDef } from '../types/role';
import { MODULOS } from '@/lib/permisos';

export const COLORES = ['#1581E3', '#16a34a', '#dc2626', '#d97706', '#9333ea', '#0891b2', '#64748b', '#db2777'];

export const ROLES_BASE: RolDef[] = [
  { id: 'admin', nombre: 'Administrador', color: '#1581E3', permisos: MODULOS.map(m => m.id) },
  { id: 'cajero', nombre: 'Cajero', color: '#16a34a', permisos: ['dashboard','pos','ventas','clientes','cotizaciones','devoluciones','caja','garantias','servicio'] },
  { id: 'supervisor', nombre: 'Supervisor', color: '#d97706', permisos: ['dashboard','pos','ventas','pedidos','clientes','inventario','cotizaciones','devoluciones','caja','garantias','servicio','descuentos','cierres','reportes'] },
  { id: 'contador', nombre: 'Contador', color: '#9333ea', permisos: ['dashboard','contabilidad','cuentas'] },
  { id: 'bodega', nombre: 'Bodega', color: '#0891b2', permisos: ['dashboard','inventario','compras','proveedores'] },
];

export const GROUPS = Array.from(new Set(MODULOS.map(m => m.group)));
