'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { MODULOS, PERMISOS_CAJERO_DEFAULT, parsePermisos } from '@/lib/permisos';
import { useUsuarios } from '@/modules/usuarios/hooks/use-usuarios';
import { UsuariosTable } from '@/modules/usuarios/components/UsuariosTable';
import { UsuarioFormModal } from '@/modules/usuarios/components/UsuarioFormModal';

interface RolDef { id: string; nombre: string; color: string; permisos: string[] }

const ROLES_BASE: RolDef[] = [
  { id: 'admin',      nombre: 'Administrador', color: '#1581E3', permisos: MODULOS.map(m => m.id) },
  { id: 'cajero',     nombre: 'Cajero',        color: '#16a34a', permisos: PERMISOS_CAJERO_DEFAULT },
  { id: 'supervisor', nombre: 'Supervisor',    color: '#d97706', permisos: ['dashboard','pos','ventas','pedidos','clientes','inventario','cotizaciones','devoluciones','caja','garantias','servicio','descuentos','cierres','reportes'] },
  { id: 'contador',   nombre: 'Contador',      color: '#9333ea', permisos: ['dashboard','contabilidad','cuentas'] },
  { id: 'bodega',     nombre: 'Bodega',        color: '#0891b2', permisos: ['dashboard','inventario','compras','proveedores'] },
];

const GROUPS = Array.from(new Set(MODULOS.map(m => m.group)));
const emptyForm = { id: 0, nombre: '', usuario: '', password: '', rol: 'cajero', permisos: [] as string[], metaMensual: '' };

export function UsuariosModule() {
  const { usuarios, fetchUsuarios, createUsuario, updateUsuario, deleteUsuario, activarUsuario, cerrarSesion } = useUsuarios();
  
  const [showModal, setShowModal] = useState(false);
  const [showPermisos, setShowPermisos] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<RolDef[]>(ROLES_BASE);

  const loadAll = async () => {
    fetchUsuarios();
    try {
      const cfgRes = await fetch('/api/config');
      const cfg = await cfgRes.json();
      let custom: RolDef[] = [];
      try { custom = JSON.parse(cfg.roles_personalizados || '[]'); } catch {}
      const merged = [...ROLES_BASE];
      custom.forEach((c: RolDef) => {
        const idx = merged.findIndex(r => r.id === c.id);
        if (idx >= 0) merged[idx] = c; else merged.push(c);
      });
      setRoles(merged);
    } catch {}
  };

  useEffect(() => { loadAll(); }, []);

  const openNew = () => { 
    setForm({ ...emptyForm, permisos: [...PERMISOS_CAJERO_DEFAULT] }); 
    setShowModal(true); 
    setShowPermisos(false); 
  };

  const openEdit = (u: any) => {
    const perms = parsePermisos(u.permisos);
    setForm({ 
      id: u.id, 
      nombre: u.nombre, 
      usuario: u.usuario, 
      password: '', 
      rol: u.rol, 
      permisos: perms.length > 0 ? perms : [...PERMISOS_CAJERO_DEFAULT], 
      metaMensual: String(u.metaMensual || '') 
    });
    setShowModal(true); 
    setShowPermisos(false);
  };

  const handleSave = async () => {
    if (!form.nombre || !form.usuario) { toast.error('Nombre y usuario requeridos'); return; }
    if (!form.id && !form.password) { toast.error('Contraseña requerida'); return; }
    
    setLoading(true);
    try {
      const dataToSave = { ...form, permisos: form.rol === 'admin' ? [] : form.permisos, metaMensual: parseFloat(form.metaMensual || '0') };
      if (form.id) {
        await updateUsuario(form.id, dataToSave);
      } else {
        await createUsuario(dataToSave);
      }
      toast.success('Usuario guardado exitosamente');
      setShowModal(false);
    } catch (e: any) {
      toast.error(e.message || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const handleDesactivar = async (id: number) => {
    try {
      await deleteUsuario(id);
      toast.success('Usuario desactivado');
    } catch (e: any) {
      toast.error(e.message || 'Error');
    }
  };

  const handleActivar = async (id: number) => {
    try {
      await activarUsuario(id);
      toast.success('Usuario reactivado');
    } catch (e: any) {
      toast.error(e.message || 'Error');
    }
  };

  const handleCerrarSesion = async (id: number) => {
    try {
      await cerrarSesion(id);
      toast.success('Sesión cerrada correctamente');
    } catch (e: any) {
      toast.error(e.message || 'Error al cerrar sesión');
    }
  };

  return (
    <div style={{ padding: '24px 32px', background: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>Usuarios y Permisos</h1>
          <p style={{ color: '#64748b', marginTop: 4 }}>Administra el acceso y roles de los cajeros y supervisores.</p>
        </div>
        <button className="btn-primary" onClick={openNew}>+ Nuevo Usuario</button>
      </div>

      <UsuariosTable 
        usuarios={usuarios} 
        roles={roles} 
        onEdit={openEdit} 
        onDesactivar={handleDesactivar} 
        onActivar={handleActivar} 
        onCerrarSesion={handleCerrarSesion} 
      />

      {showModal && (
        <UsuarioFormModal 
          form={form} 
          setForm={setForm} 
          roles={roles} 
          showPermisos={showPermisos} 
          setShowPermisos={setShowPermisos} 
          onSave={handleSave} 
          onClose={() => setShowModal(false)} 
          loading={loading} 
          GROUPS={GROUPS} 
        />
      )}
    </div>
  );
}
