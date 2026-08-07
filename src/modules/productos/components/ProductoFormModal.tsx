'use client';

import React, { useState, useEffect } from 'react';
import { useCreateProducto, useUpdateProducto } from '../hooks/use-productos';
import { Producto } from '../types/producto';
import { toast } from 'sonner';

interface ProductoFormModalProps {
  producto: Producto | null;
  onClose: () => void;
  onSuccess: () => void;
  categorias: string[];
}

export function ProductoFormModal({ producto, onClose, onSuccess, categorias }: ProductoFormModalProps) {
  const { createProducto, loading: creating } = useCreateProducto();
  const { updateProducto, loading: updating } = useUpdateProducto();
  const loading = creating || updating;

  const [form, setForm] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    precio: '',
    costo: '',
    stock: '',
    stockMinimo: '5',
    categoria: 'General',
    unidad: 'unidad',
    imagenUrl: ''
  });
  
  const [nuevaCategoria, setNuevaCategoria] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (producto) {
      setForm({
        codigo: producto.codigo || '',
        nombre: producto.nombre,
        descripcion: producto.descripcion || '',
        precio: String(producto.precio),
        costo: String(producto.costo),
        stock: String(producto.stock),
        stockMinimo: String(producto.stockMinimo),
        categoria: producto.categoria || 'General',
        unidad: producto.unidad || 'unidad',
        imagenUrl: producto.imagenUrl || ''
      });
    }
  }, [producto]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre || !form.precio) {
      toast.error('Nombre y precio son requeridos');
      return;
    }

    try {
      if (producto) {
        await updateProducto(producto.id, form);
        toast.success('Producto actualizado');
      } else {
        await createProducto(form);
        toast.success('Producto creado');
      }
      onSuccess();
    } catch (e: any) {
      toast.error(e.message || 'Error al guardar');
    }
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.ok) {
        setForm(prev => ({ ...prev, imagenUrl: data.url }));
      } else {
        toast.error(data.error || 'Error al subir imagen');
      }
    } catch (e: any) {
      toast.error(e.message || 'Error de conexión');
    } finally {
      setUploading(false);
    }
  };

  const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, overflowY: 'auto' }}>
      <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: '100%', maxWidth: 600, margin: 'auto', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#0f172a' }}>
            {producto ? 'Editar Producto' : 'Nuevo Producto'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#94a3b8' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={lbl}>Nombre del producto *</label>
            <input className="input" autoFocus value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Cámara IP Hikvision 2MP" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={lbl}>Código (opcional)</label>
              <input className="input" value={form.codigo} onChange={e => setForm({ ...form, codigo: e.target.value })} placeholder="Auto-generado si vacío" />
            </div>
            <div>
              <label style={lbl}>Categoría</label>
              <select className="input" value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}>
                {categorias.map(c => <option key={c} value={c}>{c}</option>)}
                <option value="OTRA">+ Nueva Categoría...</option>
              </select>
            </div>
          </div>

          {form.categoria === 'OTRA' && (
            <div>
              <label style={lbl}>Nombre Nueva Categoría</label>
              <input className="input" value={nuevaCategoria} onChange={e => {
                setNuevaCategoria(e.target.value);
                setForm(prev => ({ ...prev, categoria: e.target.value }));
              }} placeholder="Ej: Redes, Servidores..." />
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={lbl}>Precio Venta (Q) *</label>
              <input type="number" step="0.01" className="input" value={form.precio} onChange={e => setForm({ ...form, precio: e.target.value })} placeholder="0.00" />
            </div>
            <div>
              <label style={lbl}>Costo Compra (Q)</label>
              <input type="number" step="0.01" className="input" value={form.costo} onChange={e => setForm({ ...form, costo: e.target.value })} placeholder="0.00" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={lbl}>Stock Inicial</label>
              <input type="number" min="0" step="1" className="input" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} placeholder="0" />
            </div>
            <div>
              <label style={lbl}>Stock Mínimo</label>
              <input type="number" min="0" step="1" className="input" value={form.stockMinimo} onChange={e => setForm({ ...form, stockMinimo: e.target.value })} placeholder="5" />
            </div>
          </div>

          <div>
            <label style={lbl}>Descripción</label>
            <textarea className="input" rows={2} value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="Detalles técnicos, especificaciones..." />
          </div>

          <div>
            <label style={lbl}>Imagen del producto</label>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              {form.imagenUrl && <img src={form.imagenUrl} alt="Preview" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6, border: '1px solid #e2e8f0' }} />}
              <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0])} disabled={uploading} style={{ fontSize: 12 }} />
              {uploading && <span style={{ fontSize: 12, color: '#2563eb' }}>Subiendo...</span>}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
            <button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : producto ? 'Guardar Cambios' : 'Crear Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
