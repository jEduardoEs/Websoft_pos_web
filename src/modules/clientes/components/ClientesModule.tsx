'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useClientes } from '@/modules/clientes/hooks/use-clientes';
import { ClientesTable } from '@/modules/clientes/components/ClientesTable';
import { ClienteFormModal } from '@/modules/clientes/components/ClienteFormModal';
import { Cliente } from '@/modules/clientes/types/cliente';

const emptyForm = { id: 0, nombre: '', nit: '', telefono: '', email: '', direccion: '', notas: '' };
const WA_PREFIX = '502';

export function ClientesModule() {
  const { clientes, fetchClientes, createCliente, updateCliente, deleteCliente, loading: apiLoading } = useClientes();
  
  const [buscar, setBuscar] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<any>(emptyForm);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchClientes(buscar);
  }, [buscar, fetchClientes]);

  const openNew = () => { 
    setForm(emptyForm); 
    setShowModal(true); 
  };

  const openEdit = (c: Cliente) => { 
    setForm({ 
      id: c.id, 
      nombre: c.nombre, 
      nit: c.nit || '', 
      telefono: c.telefono || '', 
      email: c.email || '', 
      direccion: c.direccion || '', 
      notas: c.notas || '' 
    }); 
    setShowModal(true); 
  };

  const handleSave = async () => {
    if (!form.nombre) { toast.error('Nombre requerido'); return; }
    
    setLoading(true);
    try {
      if (form.id) {
        await updateCliente(form.id, form);
      } else {
        await createCliente(form);
      }
      toast.success('Cliente guardado exitosamente');
      setShowModal(false);
    } catch (e: any) {
      toast.error(e.message || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (c: Cliente) => {
    if (!confirm(`¿Eliminar cliente "${c.nombre}"?`)) return;
    try {
      await deleteCliente(c.id);
      toast.success('Cliente eliminado');
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
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#18181b' }}>Clientes</h1>
          <p style={{ fontSize: 12, color: '#8a887e', marginTop: 2 }}>{clientes.length} registrados</p>
        </div>
        <div className="page-header-actions">
          <button className="btn-primary" onClick={openNew}>+ Nuevo cliente</button>
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
      <ClientesTable 
        clientes={clientes} 
        onEdit={openEdit} 
        onDelete={handleDelete} 
        onWhatsApp={abrirWA} 
      />

      {/* Modal */}
      {showModal && (
        <ClienteFormModal 
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
