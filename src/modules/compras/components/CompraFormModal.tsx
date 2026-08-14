import React, { useState } from 'react';
import { toast } from 'sonner';
import { fmt } from '@/lib/utils';
import { CreateCompraDto } from '../dto/create-compra.dto';
import { useCompras } from '../hooks/use-compras';
import { matchesSearchQuery } from '@/lib/search-utils';
import { ProductoFormModal } from '@/modules/productos/components/ProductoFormModal';

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
  const [xmlParsed, setXmlParsed] = useState<any>(null);

  const [form, setForm] = useState({
    proveedorId: '',
    fecha: new Date().toISOString().slice(0, 10),
    numeroFactura: '',
    serieFactura: '',
    facturaUrl: '',
    notas: '',
  });

  const [items, setItems] = useState<{ productoId: string; nombre: string; cantidad: string; precioUnitario: string; subtotal: number; _xmlNombre?: string; _xmlCodigo?: string }[]>([]);
  const [buscarProd, setBuscarProd] = useState('');

  const [showNuevoProd, setShowNuevoProd] = useState<{ nombre: string; costo: string; codigo?: string; idx: number } | null>(null);

  const setF = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const addItem = () => setItems(p => [...p, { productoId: '', nombre: '', cantidad: '1', precioUnitario: '', subtotal: 0 }]);

  const selProducto = (i: number, prodId: string) => {
    const prod = productos.find(p => p.id === Number(prodId));
    setItems(prev => prev.map((item, idx) => {
      if (idx !== i) return item;
      const precio = prod?.costo || 0;
      const cantidad = Number(item.cantidad) || 1;
      return { ...item, productoId: prodId, nombre: prod?.nombre || '', precioUnitario: String(precio), subtotal: precio * cantidad };
    }));
  };

  const updItem = (i: number, k: string, v: string) => {
    setItems(prev => prev.map((item, idx) => {
      if (idx !== i) return item;
      const updated = { ...item, [k]: v };
      const precio = parseFloat(updated.precioUnitario) || 0;
      const cantidad = parseFloat(updated.cantidad) || 0;
      return { ...updated, subtotal: precio * cantidad };
    }));
  };

  const removeItem = (i: number) => setItems(p => p.filter((_, idx) => idx !== i));
  const total = items.reduce((s, i) => s + i.subtotal, 0);

  const prodFiltrados = productos.filter(p => !buscarProd || matchesSearchQuery(`${p.codigo || ''} ${p.nombre || ''} ${p.descripcion || ''} ${p.categoria || ''}`, buscarProd));

  const handleUploadFacturaFile = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadFactura(file);
      setF('facturaUrl', url);
      toast.success('Factura subida');
    } catch (err: any) {
      toast.error(err.message || 'Error al subir factura');
    } finally {
      setUploading(false);
    }
  };

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
      const nitEmisor = getAttrEl(emisorEl, 'NITEmisor');
      const nombreEmisor = getAttrEl(emisorEl, 'NombreComercial') || getAttrEl(emisorEl, 'NombreEmisor');

      const numAutEl = getByLocal('NumeroAutorizacion');
      const numAutorizacion = numAutEl?.textContent?.trim() || '';
      const serie = getAttrEl(numAutEl, 'Serie');

      const datosEl = getByLocal('DatosGenerales');
      const fechaEmision = getAttrEl(datosEl, 'FechaHoraEmision')?.slice(0, 10) || '';
      const granTotal = getByLocal('GranTotal')?.textContent?.trim() || '';

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
        const precioUnitarioVal = +(getItemLocal('PrecioUnitario') || '0');
        const precioVal = +(getItemLocal('Precio') || '0');
        const montoVal = +(getItemLocal('Monto') || '0');
        const codigo = getItemLocal('Codigo') || getItemLocal('CodigoItem') || '';
        
        const costoUnit = precioUnitarioVal > 0 
          ? precioUnitarioVal 
          : precioVal > 0 
            ? precioVal / cantidad 
            : montoVal > 0 
              ? montoVal / cantidad 
              : 0;

        if (desc) {
          xmlItems.push({
            nombre: desc,
            cantidad,
            precioUnitario: costoUnit.toFixed(2),
            subtotal: (cantidad * costoUnit),
            productoId: '',
            codigo,
          });
        }
      }

      setXmlParsed({ nitEmisor, nombreEmisor, numAutorizacion, serie, fechaEmision, total: granTotal, items: xmlItems });

      if (numAutorizacion) setForm(p => ({ ...p, numeroFactura: numAutorizacion }));
      if (serie) setForm(p => ({ ...p, serieFactura: serie }));
      if (fechaEmision) setForm(p => ({ ...p, fecha: fechaEmision }));

      if (xmlItems.length > 0) {
        setItems(xmlItems.map(xi => {
          const match = productos.find(p => {
            if (!p) return false;
            const pCode = (p.codigo || '').toLowerCase().trim();
            const xiCode = (xi.codigo || '').toLowerCase().trim();
            if (pCode && xiCode && pCode === xiCode) return true;

            const pName = (p.nombre || '').toLowerCase().trim();
            const xiName = (xi.nombre || '').toLowerCase().trim();
            if (pName && xiName) {
              if (pName === xiName) return true;
              if (pName.includes(xiName) || xiName.includes(pName)) return true;
            }
            return false;
          });

          return {
            productoId: match ? String(match.id) : '',
            nombre: match ? match.nombre : xi.nombre,
            cantidad: String(xi.cantidad),
            precioUnitario: xi.precioUnitario,
            subtotal: xi.subtotal,
            _xmlNombre: xi.nombre,
            _xmlCodigo: xi.codigo || '',
          };
        }));
      }

      const matched = xmlItems.filter(xi =>
        productos.some(p =>
          p.nombre.toLowerCase().includes(xi.nombre.toLowerCase()) ||
          xi.nombre.toLowerCase().includes(p.nombre.toLowerCase())
        )
      ).length;
      toast.success(`XML leido: ${nombreEmisor} · ${xmlItems.length} items · ${matched} encontrados en inventario`);
    } catch (err) {
      console.error('XML parse error:', err);
      toast.error('Error al leer el XML. Verifica que sea un archivo FEL valido.');
    }
    setXmlLoading(false);
  };

  const save = async () => {
    if (items.length === 0) {
      toast.error('Agrega al menos un producto');
      return;
    }
    const invalid = items.find(i => !i.nombre || !i.cantidad || !i.precioUnitario);
    if (invalid) {
      toast.error('Completa todos los campos de los items');
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
        items: items.map(i => ({
          productoId: i.productoId ? Number(i.productoId) : undefined,
          nombre: i.nombre,
          cantidad: Number(i.cantidad),
          precioUnitario: Number(i.precioUnitario)
        }))
      };
      await createCompra(dto);
      toast.success('Compra registrada — stock actualizado');
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar la compra');
    } finally {
      setLoading(false);
    }
  };

  const categoriasDisponibles = Array.from(new Set(productos.map(p => p.categoria || 'General').filter(Boolean)));
  const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 20, overflowY: 'auto' }}>
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 28, width: '100%', maxWidth: 860, margin: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Nueva Compra</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#94a3b8' }}>&times;</button>
        </div>

        {/* Encabezado factura */}
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', marginBottom: 12 }}>Datos de la factura</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            <div>
              <label style={lbl}>Proveedor</label>
              <select className="input" value={form.proveedorId} onChange={e => setF('proveedorId', e.target.value)}>
                <option value="">Sin proveedor</option>
                {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Fecha de compra</label>
              <input className="input" type="date" value={form.fecha} onChange={e => setF('fecha', e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Serie de factura</label>
              <input className="input" value={form.serieFactura} onChange={e => setF('serieFactura', e.target.value.toUpperCase())} placeholder="Ej: A, B, ABC..." />
            </div>
            <div>
              <label style={lbl}>Número de factura</label>
              <input className="input" value={form.numeroFactura} onChange={e => setF('numeroFactura', e.target.value)} placeholder="Ej: 000123" />
            </div>
            <div style={{ gridColumn: '3', gridRow: '1/3' }}>
              <label style={lbl}>Factura PDF o imagen</label>
              <div style={{ border: '2px dashed #e2e8f0', borderRadius: 8, padding: 16, textAlign: 'center', cursor: 'pointer', background: form.facturaUrl ? '#f0fdf4' : '#fff' }}
                onClick={() => document.getElementById('upload-factura')?.click()}>
                {form.facturaUrl
                  ? <div>
                      <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>Factura subida</div>
                      <a href={form.facturaUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#2563eb' }}>Ver archivo</a>
                    </div>
                  : <div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{uploading ? 'Subiendo...' : 'Clic para subir PDF o foto de factura'}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>PDF, JPG, PNG</div>
                    </div>}
              </div>
              <input id="upload-factura" type="file" accept=".pdf,image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleUploadFacturaFile(e.target.files[0])} />
            </div>
            <div style={{ gridColumn: '1/3' }}>
              <label style={lbl}>Notas</label>
              <input className="input" value={form.notas} onChange={e => setF('notas', e.target.value)} placeholder="Observaciones de la compra" />
            </div>
          </div>
        </div>

        {/* Productos */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase' }}>Artículos comprados</div>
            <button className="btn-ghost btn-sm" onClick={addItem}>+ Agregar item</button>
          </div>

          {/* XML FEL */}
          <div style={{ marginBottom: 12, padding: '10px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>XML Factura SAT (FEL) — opcional</div>
            <input type="file" accept=".xml" onChange={e => e.target.files?.[0] && parseXML(e.target.files[0])} style={{ fontSize: 12 }} />
            {xmlLoading && <div style={{ fontSize: 11, color: '#2563eb', marginTop: 4 }}>Leyendo XML...</div>}
            {xmlParsed && (
              <div style={{ marginTop: 6, fontSize: 11, color: '#166534', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '6px 10px' }}>
                Leido: {xmlParsed.nombreEmisor} · {xmlParsed.items?.length || 0} productos cargados
              </div>
            )}
          </div>

          {/* Buscador de productos */}
          <div style={{ marginBottom: 10 }}>
            <input className="input" placeholder="Buscar producto del inventario..." value={buscarProd} onChange={e => setBuscarProd(e.target.value)} style={{ fontSize: 12 }} />
          </div>

          {/* Headers */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px 110px 90px 24px', gap: 6, marginBottom: 6 }}>
            {['Producto (inventario)', 'Nombre / descripción', 'Cant.', 'Costo unit.', 'Subtotal', ''].map(h => (
              <div key={h} style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', padding: '4px 0' }}>{h}</div>
            ))}
          </div>

          {items.map((item, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px 110px 90px 24px', gap: 6, marginBottom: 6, alignItems: 'center' }}>
              <div>
                <select className="input" value={item.productoId} onChange={e => selProducto(i, e.target.value)} style={{ fontSize: 12 }}>
                  <option value="">Servicio / otro</option>
                  {prodFiltrados.map(p => <option key={p.id} value={p.id}>{p.codigo ? `[${p.codigo}] ` : ''}{p.nombre}</option>)}
                </select>
                {!item.productoId && (
                  <button onClick={() => {
                    setShowNuevoProd({
                      nombre: item._xmlNombre || item.nombre || '',
                      costo: item.precioUnitario || '0',
                      codigo: item._xmlCodigo || '',
                      idx: i,
                    });
                  }} style={{ marginTop: 3, fontSize: 10, fontWeight: 700, padding: '2px 8px', background: '#fef3c7', color: '#d97706', border: '1px solid #fde68a', borderRadius: 5, cursor: 'pointer', fontFamily: 'inherit', display: 'block', width: '100%' }}>
                    + Agregar al inventario
                  </button>
                )}
              </div>
              <input className="input" value={item.nombre} onChange={e => updItem(i, 'nombre', e.target.value)} placeholder="Descripción" style={{ fontSize: 12 }} />
              <input className="input" type="number" min="1" value={item.cantidad} onChange={e => updItem(i, 'cantidad', e.target.value)} style={{ fontSize: 12, textAlign: 'center' }} />
              <input className="input" type="number" min="0" value={item.precioUnitario} onChange={e => updItem(i, 'precioUnitario', e.target.value)} placeholder="0.00" style={{ fontSize: 12 }} />
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', textAlign: 'right' }}>{fmt(item.subtotal)}</div>
              <button onClick={() => removeItem(i)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 16 }}>&times;</button>
            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12, paddingTop: 12, borderTop: '1px solid #e2e8f0' }}>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 18px', textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 2 }}>Total sin IVA</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{fmt(total)}</div>
              <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>IVA incluido en cada artículo</div>
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

      {/* MODAL NUEVO PRODUCTO OFICIAL DE INVENTARIO */}
      {showNuevoProd && (
        <ProductoFormModal
          producto={{
            nombre: showNuevoProd.nombre,
            costo: parseFloat(showNuevoProd.costo) || 0,
            codigo: showNuevoProd.codigo || '',
          }}
          categorias={categoriasDisponibles.length > 0 ? categoriasDisponibles : ['General']}
          onClose={() => setShowNuevoProd(null)}
          onSuccess={(createdProd) => {
            if (createdProd) {
              const prodObj = createdProd.producto || createdProd;
              productos.push(prodObj);
              setItems(prev => prev.map((item, idx) => {
                if (idx !== showNuevoProd.idx) return item;
                return {
                  ...item,
                  productoId: String(prodObj.id),
                  nombre: prodObj.nombre,
                  precioUnitario: String(prodObj.costo || item.precioUnitario),
                };
              }));
            }
            setShowNuevoProd(null);
          }}
        />
      )}
    </div>
  );
}
