'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useProveedores } from '@/modules/proveedores/hooks/use-proveedores';
import { ProveedoresTable } from '@/modules/proveedores/components/ProveedoresTable';
import { ProveedorFormModal } from '@/modules/proveedores/components/ProveedorFormModal';
import { Proveedor } from '@/modules/proveedores/types/proveedor';

const emptyForm = { id: 0, nombre: '', nit: '', telefono: '', email: '', direccion: '', contacto: '', notas: '' };
const WA_PREFIX = '502';

export function ProveedoresModule() {
  const { proveedores, fetchProveedores, createProveedor, updateProveedor, deleteProveedor, loading: apiLoading } = useProveedores();
  
  const [buscar, setBuscar] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<any>(emptyForm);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProveedores(buscar);
  }, [buscar, fetchProveedores]);

  const openNew = () => { 
    setForm(emptyForm); 
    setShowModal(true); 
  };

  const openEdit = (p: Proveedor) => { 
    setForm({ 
      id: p.id, 
      nombre: p.nombre, 
      nit: p.nit || '', 
      contacto: p.contacto || '', 
      telefono: p.telefono || '', 
      email: p.email || '', 
      direccion: p.direccion || '', 
      notas: p.notas || '' 
    }); 
    setShowModal(true); 
  };

  const handleSave = async () => {
    if (!form.nombre) { toast.error('Nombre requerido'); return; }
    
    setLoading(true);
    try {
      if (form.id) {
        await updateProveedor(form.id, form);
      } else {
        await createProveedor(form);
      }
      toast.success('Proveedor guardado exitosamente');
      setShowModal(false);
    } catch (e: any) {
      toast.error(e.message || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (p: Proveedor) => {
    if (!confirm(`¿Eliminar proveedor "${p.nombre}"?`)) return;
    try {
      await deleteProveedor(p.id);
      toast.success('Proveedor eliminado');
    } catch (e: any) {
      toast.error(e.message || 'Error al eliminar');
    }
  };

  const abrirWA = (tel: string) => {
    const num = tel.replace(/\D/g, '');
    const prefixed = num.startsWith('502') ? num : WA_PREFIX + num;
    window.open(`https://wa.me/${prefixed}`, '_blank');
  };

  return (
    <div className="page-wrap" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#18181b' }}>Proveedores</h1>
          <p style={{ fontSize: 12, color: '#8a887e', marginTop: 2 }}>{proveedores.length} registrados</p>
        </div>
        <div className="page-header-actions">
          <button className="btn-primary" onClick={openNew}>+ Nuevo proveedor</button>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="filter-bar" style={{ display: 'flex', gap: 10 }}>
        <input 
          className="input" 
          style={{ flex: 1 }} 
          placeholder="Buscar por nombre, NIT o teléfono..." 
          value={buscar} 
          onChange={e => setBuscar(e.target.value)} 
        />
      </div>

      {/* Tabla */}
      <ProveedoresTable 
        proveedores={proveedores} 
        onEdit={openEdit} 
        onDelete={handleDelete} 
        onWhatsApp={abrirWA} 
      />

      {/* Modal */}
      {showModal && (
        <ProveedorFormModal 
          form={form} 
          setForm={setForm} 
          onSave={handleSave} 
          onClose={() => setShowModal(false)} 
          loading={loading || apiLoading} 
        />
      )}
    </div>
  );
}
