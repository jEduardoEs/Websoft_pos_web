'use client';

import React, { useState, useEffect } from 'react';
import { useCreateProducto, useUpdateProducto } from '../hooks/use-productos';
import { Producto } from '../types/producto';
import { toast } from 'sonner';

interface ProductoFormModalProps {
  producto: Partial<Producto> | null;
  onClose: () => void;
  onSuccess: (created?: any) => void;
  categorias: string[];
}

export function ProductoFormModal({ producto, onClose, onSuccess, categorias }: ProductoFormModalProps) {
  const { createProducto, loading: creating } = useCreateProducto();
  const { updateProducto, loading: updating } = useUpdateProducto();
  const loading = creating || updating;

  const [margin, setMargin] = useState<number>(0.20);
  const [ivaAmount, setIvaAmount] = useState<string>('0.00');

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
        nombre: producto.nombre || '',
        descripcion: producto.descripcion || '',
        precio: producto.precio !== undefined ? String(producto.precio) : '',
        costo: producto.costo !== undefined ? String(producto.costo) : '',
        stock: producto.stock !== undefined ? String(producto.stock) : '',
        stockMinimo: producto.stockMinimo !== undefined ? String(producto.stockMinimo) : '5',
        categoria: producto.categoria || 'General',
        unidad: producto.unidad || 'unidad',
        imagenUrl: producto.imagenUrl || ''
      });
    }
  }, [producto]);

  // Auto-calculate price with margin and 5% IVA
  useEffect(() => {
    const costNum = parseFloat(form.costo);
    if (!isNaN(costNum) && costNum > 0) {
      const base = costNum * (1 + margin);
      const iva = base * 0.05;
      const total = (base + iva).toFixed(2);
      const ivaStr = iva.toFixed(2);
      setForm(prev => {
        if (prev.precio === total) return prev;
        return { ...prev, precio: total };
      });
      setIvaAmount(ivaStr);
    } else {
      setIvaAmount('0.00');
    }
  }, [form.costo, margin]);

  const setF = (key: string, value: string) => setForm(p => ({ ...p, [key]: value }));

  const save = async () => {
    if (!form.nombre) {
      toast.error('Nombre requerido');
      return;
    }

    try {
      if (producto && producto.id) {
        const res = await updateProducto(producto.id, form);
        toast.success('Producto actualizado');
        onSuccess(res?.producto || res);
      } else {
        const res = await createProducto(form);
        toast.success('Producto creado');
        onSuccess(res?.producto || res);
      }
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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 20, overflowY: 'auto' }}>
      <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: '100%', maxWidth: 620, margin: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>{producto?.id ? 'Editar' : 'Nuevo'} Producto</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#475569' }}>&times;</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

          <div style={{ gridColumn: '1/-1' }}>
            <label style={lbl}>Nombre *</label>
            <input className="input" value={form.nombre} onChange={e => setF('nombre', e.target.value)} />
          </div>

          <div>
            <label style={lbl}>Codigo (dejar vacío = auto)</label>
            <input className="input" value={form.codigo} onChange={e => setF('codigo', e.target.value)} placeholder="WSP-0001" />
          </div>

          <div>
            <label style={lbl}>Categoria</label>
            <select className="input" value={form.categoria} onChange={e => setF('categoria', e.target.value)}>
              {categorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              {!categorias.includes(form.categoria) && form.categoria && <option value={form.categoria}>{form.categoria}</option>}
            </select>
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              <input className="input" value={nuevaCategoria} onChange={e => setNuevaCategoria(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && nuevaCategoria.trim()) { e.preventDefault(); setF('categoria', nuevaCategoria.trim()); setNuevaCategoria(''); }}}
                placeholder="+ Nueva categoria..." style={{ flex: 1, fontSize: 12 }} />
              <button type="button" onClick={() => { if (nuevaCategoria.trim()) { setF('categoria', nuevaCategoria.trim()); setNuevaCategoria(''); }}}
                style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '0 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                Agregar
              </button>
            </div>
          </div>

          <div style={{ gridColumn: '1/-1' }}>
            <label style={lbl}>Descripcion</label>
            <input className="input" value={form.descripcion} onChange={e => setF('descripcion', e.target.value)} />
          </div>

          <div>
            <label style={lbl}>Costo Compra Q</label>
            <input className="input" type="number" step="0.01" value={form.costo} onChange={e => setF('costo', e.target.value)} placeholder="0.00" />
          </div>

          <div>
            <label style={lbl}>Margen de Ganancia</label>
            <select className="input" value={margin} onChange={e => setMargin(parseFloat(e.target.value))}>
              <option value={0.20}>20%</option>
              <option value={0.25}>25%</option>
              <option value={0.30}>30%</option>
              <option value={0.35}>35%</option>
              <option value={0.40}>40%</option>
              <option value={0.50}>50%</option>
              <option value={0.60}>60%</option>
              <option value={0.70}>70%</option>
              <option value={0.80}>80%</option>
              <option value={0.90}>90%</option>
              <option value={1.00}>100%</option>
            </select>
          </div>

          <div>
            <label style={lbl}>IVA (5%)</label>
            <input className="input" type="number" step="0.01" value={ivaAmount} readOnly disabled placeholder="0.00" style={{ background: '#f8fafc' }} />
          </div>

          <div>
            <label style={lbl}>Precio Venta (con IVA)</label>
            <input className="input" type="number" step="0.01" value={form.precio} onChange={e => setF('precio', e.target.value)} placeholder="0.00" />
          </div>

          <div>
            <label style={lbl}>Stock inicial</label>
            <input className="input" type="number" value={form.stock} onChange={e => setF('stock', e.target.value)} disabled={!!producto?.id} title={producto?.id ? "Usa el Kardex para ajustar stock" : ""} />
          </div>

          <div>
            <label style={lbl}>Stock minimo</label>
            <input className="input" type="number" value={form.stockMinimo} onChange={e => setF('stockMinimo', e.target.value)} />
          </div>

          <div>
            <label style={lbl}>Unidad</label>
            <input className="input" value={form.unidad} onChange={e => setF('unidad', e.target.value)} placeholder="unidad, caja, par..." />
          </div>

          <div style={{ gridColumn: '1/-1' }}>
            <label style={lbl}>Imagen del producto</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {form.imagenUrl && <img src={form.imagenUrl} alt="" style={{ width: 56, height: 56, objectFit: 'contain', borderRadius: 8, border: '1px solid #e2e8f0' }} />}
              <div>
                <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0])} style={{ fontSize: 12 }} />
              </div>
            </div>
            {uploading && <div style={{ fontSize: 12, color: '#2563eb', marginTop: 6 }}>Subiendo imagen...</div>}
          </div>

        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={save} disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</button>
        </div>
      </div>
    </div>
  );
}
