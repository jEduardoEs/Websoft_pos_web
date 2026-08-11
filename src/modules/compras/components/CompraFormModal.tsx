import React, { useState } from 'react';
import { toast } from 'sonner';
import { fmt } from '@/lib/utils';
import { CreateCompraDto } from '../dto/create-compra.dto';
import { useCompras } from '../hooks/use-compras';

interface CompraFormModalProps {
  onClose: () => void;
  onSuccess: () => void;
  proveedores: any[];
  productos: any[];
  comprasHook: ReturnType<typeof useCompras>;
}

export function CompraFormModal({ onClose, onSuccess, proveedores, productos, comprasHook }: CompraFormModalProps) {
  const { createCompra, uploadFactura } = comprasHook;
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [xmlLoading, setXmlLoading] = useState(false);
  
  const [form, setForm] = useState({
    proveedorId: '',
    fecha: new Date().toISOString().slice(0, 10),
    numeroFactura: '',
    serieFactura: '',
    facturaUrl: '',
    notas: '',
  });

  const [items, setItems] = useState<{ productoId: string; nombre: string; cantidad: string; precioUnitario: string; subtotal: number; _xmlNombre?: string }[]>([]);
  const [buscarProd, setBuscarProd] = useState('');

  const [showNuevoProd, setShowNuevoProd] = useState<{nombre: string, idx: number} | null>(null);
  const [nuevoForm, setNuevoForm] = useState({ nombre: '', codigo: '', categoria: '', precio: '', costo: '', stock: '0', stockMinimo: '2', unidad: 'unidad' });
  const [refreshProductos, setRefreshProductos] = useState(0);

  // Handle items
  const addItem = () => setItems(p => [...p, { productoId: '', nombre: '', cantidad: '1', precioUnitario: '', subtotal: 0 }]);
  
  const updItem = (i: number, k: string, v: string) => {
    setItems(prev => prev.map((item, idx) => {
      if (idx !== i) return item;
      const updated = { ...item, [k]: v };
      const precio = parseFloat(updated.precioUnitario) || 0;
      const cantidad = parseFloat(updated.cantidad) || 0;
      return { ...updated, subtotal: precio * cantidad };
    }));
  };

  const selProducto = (i: number, prodId: string) => {
    const prod = productos.find(p => p.id === Number(prodId));
    setItems(prev => prev.map((item, idx) => {
      if (idx !== i) return item;
      const precio = prod?.costo || 0;
      const cantidad = Number(item.cantidad) || 1;
      return { ...item, productoId: prodId, nombre: prod?.nombre || '', precioUnitario: String(precio), subtotal: precio * cantidad };
    }));
  };

  const removeItem = (i: number) => setItems(p => p.filter((_, idx) => idx !== i));
  const total = items.reduce((s, i) => s + i.subtotal, 0);
  const prodFiltrados = productos.filter(p => p.nombre.toLowerCase().includes(buscarProd.toLowerCase()) || p.codigo?.toLowerCase().includes(buscarProd.toLowerCase()));

  // XML Parser
  const parseXML = async (file: File) => {
    setXmlLoading(true);
    try {
      const text = await file.text();
      const parser = new DOMParser();
      const xml = parser.parseFromString(text, 'application/xml');

      const getByLocal = (localName: string): Element | null => {
        const all = xml.getElementsByTagName('*');
        for (let i = 0; i < all.length; i++) {
          if (all[i].localName === localName) return all[i];
        }
        return null;
      };

      const getAllByLocal = (localName: string): Element[] => {
        const all = xml.getElementsByTagName('*');
        const result: Element[] = [];
        for (let i = 0; i < all.length; i++) {
          if (all[i].localName === localName) result.push(all[i]);
        }
        return result;
      };

      const getAttrEl = (el: Element | null, attr: string) => el?.getAttribute(attr) || '';

      const emisorEl = getByLocal('Emisor');
      const nombreEmisor = getAttrEl(emisorEl, 'NombreComercial') || getAttrEl(emisorEl, 'NombreEmisor');

      const numAutEl = getByLocal('NumeroAutorizacion');
      const numAutorizacion = numAutEl?.textContent?.trim() || '';
      const serie = getAttrEl(numAutEl, 'Serie');

      const datosEl = getByLocal('DatosGenerales');
      const fechaEmision = getAttrEl(datosEl, 'FechaHoraEmision')?.slice(0, 10) || '';

      const itemEls = getAllByLocal('Item');
      const xmlItems: any[] = [];
      for (const itemEl of itemEls) {
        const getItemLocal = (ln: string) => {
          const all = itemEl.getElementsByTagName('*');
          for (let i = 0; i < all.length; i++) {
            if (all[i].localName === ln) return all[i].textContent?.trim() || '';
          }
          return '';
        };
        const desc = getItemLocal('Descripcion');
        const cantidad = +(getItemLocal('Cantidad') || '1');
        const montoGravable = +(getItemLocal('MontoGravable') || '0');
        const precioUnitario = +(getItemLocal('PrecioUnitario') || '0');
        const costoUnit = montoGravable > 0 ? montoGravable / cantidad : precioUnitario > 0 ? precioUnitario / 1.12 : 0;
        if (desc) xmlItems.push({ nombre: desc, cantidad, precioUnitario: costoUnit.toFixed(2), subtotal: (cantidad * costoUnit), productoId: '' });
      }

      if (numAutorizacion) setForm(p => ({ ...p, numeroFactura: numAutorizacion }));
      if (serie) setForm(p => ({ ...p, serieFactura: serie }));
      if (fechaEmision) setForm(p => ({ ...p, fecha: fechaEmision }));

      if (xmlItems.length > 0) {
        setItems(xmlItems.map(xi => {
          const match = productos.find(p => p.nombre.toLowerCase().includes(xi.nombre.toLowerCase()) || xi.nombre.toLowerCase().includes(p.nombre.toLowerCase()));
          return {
            productoId: match ? String(match.id) : '',
            nombre: xi.nombre,
            cantidad: String(xi.cantidad),
            precioUnitario: xi.precioUnitario,
            subtotal: xi.subtotal,
            _xmlNombre: xi.nombre,
          };
        }));
      }

      toast.success(`XML leído: ${nombreEmisor} — ${xmlItems.length} items`);
    } catch (err) {
      console.error('XML parse error:', err);
      toast.error('Error al leer el XML. Verifica que sea un archivo FEL válido.');
    }
    setXmlLoading(false);
  };

  const saveNuevoProducto = async () => {
    if (!nuevoForm.nombre || !nuevoForm.precio) { toast.error('Nombre y precio de venta son requeridos'); return; }
    try {
      const res = await fetch('/api/productos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nuevoForm.nombre,
          codigo: nuevoForm.codigo || null,
          categoria: nuevoForm.categoria || 'General',
          precio: +nuevoForm.precio,
          costo: +nuevoForm.costo || 0,
          stock: +nuevoForm.stock || 0,
          stockMinimo: +nuevoForm.stockMinimo || 2,
          unidad: nuevoForm.unidad,
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar');
      
      const prod = data.producto || data;
      // update items
      if (showNuevoProd) {
        setItems(prev => prev.map((item, idx) => {
          if (idx !== showNuevoProd.idx) return item;
          return { ...item, productoId: String(prod.id), nombre: prod.nombre };
        }));
      }
      toast.success('Producto agregado al inventario');
      setShowNuevoProd(null);
      // Trigger a refresh event for the parent to reload products, or we can just append it locally
      productos.push(prod); 
      setRefreshProductos(prev => prev + 1);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleUploadFactura = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setUploading(true);
    try {
      const url = await uploadFactura(e.target.files[0]);
      setForm(prev => ({ ...prev, facturaUrl: url }));
      toast.success('Factura PDF subida');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (items.length === 0) {
      toast.error('Agrega al menos un artículo a la compra');
      return;
    }
    setLoading(true);
    try {
      const dto: CreateCompraDto = {
        proveedorId: form.proveedorId ? Number(form.proveedorId) : undefined,
        fecha: form.fecha,
        numeroFactura: form.numeroFactura || undefined,
        serieFactura: form.serieFactura || undefined,
        facturaUrl: form.facturaUrl || undefined,
        notas: form.notas || undefined,
        items: items.map(it => ({
          productoId: it.productoId ? Number(it.productoId) : undefined,
          nombre: it.nombre,
          cantidad: Number(it.cantidad),
          precioUnitario: Number(it.precioUnitario)
        }))
      };
      
      await createCompra(dto);
      toast.success('Compra registrada correctamente');
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar la compra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 28, width: '100%', maxWidth: 900, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>Registrar Compra</div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Ingresa los datos de la factura y los productos adquiridos. El stock se sumará automáticamente.</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#94a3b8' }}></button>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 24, padding: 14, background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>1. Importar Factura XML (Opcional)</div>
            <input type="file" accept=".xml" onChange={e => e.target.files?.length && parseXML(e.target.files[0])} disabled={xmlLoading} style={{ fontSize: 12 }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>2. Adjuntar PDF (Opcional)</div>
            <input type="file" accept=".pdf,.png,.jpg" onChange={handleUploadFactura} disabled={uploading} style={{ fontSize: 12 }} />
            {form.facturaUrl && <div style={{ fontSize: 11, color: '#16a34a', marginTop: 4 }}> Archivo adjunto</div>}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 20 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Proveedor</label>
            <select className="input" value={form.proveedorId} onChange={e => setForm(p => ({ ...p, proveedorId: e.target.value }))}>
              <option value="">-- Seleccionar --</option>
              {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Fecha</label>
            <input className="input" type="date" value={form.fecha} onChange={e => setForm(p => ({ ...p, fecha: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Serie Factura</label>
              <input className="input" value={form.serieFactura} onChange={e => setForm(p => ({ ...p, serieFactura: e.target.value }))} placeholder="Ej: A" />
            </div>
            <div style={{ flex: 2 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>No. Factura</label>
              <input className="input" value={form.numeroFactura} onChange={e => setForm(p => ({ ...p, numeroFactura: e.target.value }))} placeholder="Ej: 12345678" />
            </div>
          </div>
        </div>

        <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Artículos de la Compra</div>
            <button onClick={addItem} className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}>+ Agregar línea</button>
          </div>

          <div style={{ marginBottom: 10 }}>
            <input className="input" placeholder="Buscar producto del inventario..." value={buscarProd} onChange={e => setBuscarProd(e.target.value)} style={{ fontSize: 12 }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px 110px 90px 24px', gap: 6, marginBottom: 6 }}>
            {['Producto (inventario)', 'Nombre / descripción', 'Cant.', 'Costo unit.', 'Subtotal', ''].map(h => (
              <div key={h} style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', padding: '4px 0' }}>{h}</div>
            ))}
          </div>

          {items.map((item, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px 110px 90px 24px', gap: 6, marginBottom: 6, alignItems: 'center' }}>
              <div>
                <select className="input" value={item.productoId} onChange={e => selProducto(i, e.target.value)} style={{ fontSize: 12 }}>
                  <option value="">Servicio / otro (No inventariar)</option>
                  {(buscarProd ? prodFiltrados : productos).map(p => <option key={p.id} value={p.id}>{p.codigo ? `[${p.codigo}] ` : ''}{p.nombre}</option>)}
                </select>
                {!item.productoId && item._xmlNombre && (
                  <button onClick={() => {
                    setNuevoForm(p => ({ ...p, nombre: item._xmlNombre!, costo: item.precioUnitario }));
                    setShowNuevoProd({ nombre: item._xmlNombre!, idx: i });
                  }} style={{ marginTop: 4, fontSize: 10, fontWeight: 700, padding: '4px 8px', background: '#fef3c7', color: '#d97706', border: '1px solid #fde68a', borderRadius: 5, cursor: 'pointer', display: 'block', width: '100%' }}>
                    + Agregar al inventario
                  </button>
                )}
              </div>
              <input className="input" value={item.nombre} onChange={e => updItem(i, 'nombre', e.target.value)} placeholder="Descripción" style={{ fontSize: 12 }} />
              <input className="input" type="number" min="1" step="1" value={item.cantidad} onChange={e => updItem(i, 'cantidad', e.target.value)} style={{ fontSize: 12, textAlign: 'center' }} />
              <input className="input" type="number" min="0" step="0.01" value={item.precioUnitario} onChange={e => updItem(i, 'precioUnitario', e.target.value)} placeholder="0.00" style={{ fontSize: 12 }} />
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', textAlign: 'right' }}>{fmt(item.subtotal)}</div>
              <button onClick={() => removeItem(i)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 16 }}></button>
            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12, paddingTop: 12, borderTop: '1px solid #e2e8f0' }}>
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 18px', textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 2 }}>Total sin IVA</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{fmt(total)}</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={save} disabled={loading || uploading}>
            {loading ? 'Guardando...' : 'Registrar Compra'}
          </button>
        </div>
      </div>

      {showNuevoProd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800 }}>Agregar al inventario</div>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>
                  {'Producto no encontrado: '}<strong>{showNuevoProd.nombre}</strong>
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Nombre del Producto</label>
                <input className="input" value={nuevoForm.nombre} onChange={e => setNuevoForm({ ...nuevoForm, nombre: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Código SKU</label>
                <input className="input" value={nuevoForm.codigo} onChange={e => setNuevoForm({ ...nuevoForm, codigo: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Unidad de medida</label>
                <input className="input" value={nuevoForm.unidad} onChange={e => setNuevoForm({ ...nuevoForm, unidad: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Costo de compra</label>
                <input type="number" className="input" value={nuevoForm.costo} onChange={e => setNuevoForm({ ...nuevoForm, costo: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Precio de venta (Obligatorio)</label>
                <input type="number" className="input" value={nuevoForm.precio} onChange={e => setNuevoForm({ ...nuevoForm, precio: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-ghost" onClick={() => setShowNuevoProd(null)}>Cancelar</button>
              <button className="btn-primary" onClick={saveNuevoProducto}>Guardar Producto</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
