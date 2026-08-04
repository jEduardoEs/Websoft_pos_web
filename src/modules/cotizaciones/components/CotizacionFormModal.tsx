import React from 'react';
import { fmt } from '@/lib/utils';
import { useCotizacionForm } from '../hooks/use-cotizacion-form';

interface CotizacionFormModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function CotizacionFormModal({ onClose, onSuccess }: CotizacionFormModalProps) {
  const { state, setters, actions } = useCotizacionForm(() => {
    onSuccess();
    onClose();
  });

  const { form, items, loading, productos, zonas, buscarProd, baseTotal, iva, grandTotal } = state;
  const { setF, setItems, setBuscarProd } = setters;
  const { buscarNitCliente, selProducto, updItem, addItem, removeItem, guardar } = actions;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', width: '100%', maxWidth: 1100, borderRadius: 12, display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
        
        {/* Header */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Nueva Cotización</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#64748b' }}>×</button>
        </div>

        {/* Body Scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Fila 1: Cliente y Datos */}
          <div style={{ display: 'flex', gap: 24 }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>Datos del Cliente</div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
                <div>
                  <label className="label">NIT (Enter para buscar)</label>
                  <input className="input" value={form.clienteNit} onChange={e => setF('clienteNit', e.target.value)} onKeyDown={e => e.key === 'Enter' && buscarNitCliente(form.clienteNit)} />
                </div>
                <div>
                  <label className="label">Nombre / Razón Social <span style={{color: 'red'}}>*</span></label>
                  <input className="input" value={form.clienteNombre} onChange={e => setF('clienteNombre', e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="label">Teléfono</label>
                  <input className="input" value={form.clienteTelefono} onChange={e => setF('clienteTelefono', e.target.value)} />
                </div>
                <div>
                  <label className="label">Correo Electrónico (para enviar PDF)</label>
                  <input className="input" type="email" value={form.clienteCorreo} onChange={e => setF('clienteCorreo', e.target.value)} />
                </div>
              </div>

              <div>
                <label className="label">Dirección</label>
                <input className="input" value={form.clienteDireccion} onChange={e => setF('clienteDireccion', e.target.value)} />
              </div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>Condiciones Comerciales</div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="label">Atención a</label>
                  <input className="input" value={form.atencion} onChange={e => setF('atencion', e.target.value)} placeholder="Ej: Ing. Juan Pérez" />
                </div>
                <div>
                  <label className="label">Validez (Días)</label>
                  <input className="input" type="number" min="1" value={form.validezDias} onChange={e => setF('validezDias', e.target.value)} />
                </div>
              </div>

              <div>
                <label className="label">Tiempo de Instalación / Entrega</label>
                <input className="input" value={form.tiempoInstalacion} onChange={e => setF('tiempoInstalacion', e.target.value)} placeholder="Ej: 3 a 5 días hábiles" />
              </div>

              <div>
                <label className="label">Formas de Pago aceptadas</label>
                <input className="input" value={form.formaPago} onChange={e => setF('formaPago', e.target.value)} />
              </div>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0' }} />

          {/* Fila 2: Items */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>Líneas de Cotización</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => addItem('producto')} className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}>+ Producto Manual</button>
                <button type="button" onClick={() => addItem('servicio')} className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}>+ Servicio</button>
                <button type="button" onClick={() => addItem('instalacion')} className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}>+ Instalación</button>
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Buscador rápido de inventario:</div>
              <input 
                className="input" 
                placeholder="Buscar por código o nombre... (clic en el resultado para agregarlo a la última fila)"
                value={buscarProd} onChange={e => setBuscarProd(e.target.value)}
              />
              {buscarProd && productos.length > 0 && (
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, marginTop: 4, maxHeight: 150, overflowY: 'auto' }}>
                  {productos.map(p => (
                    <div key={p.id} onClick={() => { selProducto(items.length - 1, p); setBuscarProd(''); }} 
                         style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', fontSize: 12, display: 'flex', justifyContent: 'space-between' }}>
                      <span><strong>{p.codigo}</strong> - {p.nombre} (Stock: {p.stock})</span>
                      <span style={{ fontWeight: 600, color: '#16a34a' }}>{fmt(p.precio)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 10 }}>
              <thead>
                <tr style={{ background: '#f1f5f9', fontSize: 11, color: '#475569', textTransform: 'uppercase' }}>
                  <th style={{ padding: 8, textAlign: 'left', width: '8%' }}>Tipo</th>
                  <th style={{ padding: 8, textAlign: 'left', width: '12%' }}>Código</th>
                  <th style={{ padding: 8, textAlign: 'left' }}>Descripción</th>
                  <th style={{ padding: 8, textAlign: 'right', width: '10%' }}>Cant.</th>
                  <th style={{ padding: 8, textAlign: 'right', width: '12%' }}>Precio U.</th>
                  <th style={{ padding: 8, textAlign: 'right', width: '12%' }}>Desc.</th>
                  <th style={{ padding: 8, textAlign: 'right', width: '12%' }}>Total</th>
                  <th style={{ padding: 8, textAlign: 'center', width: '5%' }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: 8 }}>
                      <span style={{ fontSize: 10, padding: '2px 6px', background: it.tipo === 'producto' ? '#dbeafe' : it.tipo === 'servicio' ? '#fef3c7' : '#dcfce7', borderRadius: 4, fontWeight: 700 }}>
                        {it.tipo.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: 8 }}><input className="input" style={{ padding: '6px 8px', fontSize: 12 }} value={it.codigo} onChange={e => updItem(i, 'codigo', e.target.value)} /></td>
                    
                    <td style={{ padding: 8 }}>
                      {it.tipo === 'instalacion' ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <select className="input" style={{ padding: '6px 8px', fontSize: 12, flex: 1 }} value={it.zonaId || ''} onChange={e => {
                            const z = zonas.find(x => x.id === +e.target.value);
                            if (z) { updItem(i, 'zonaId', z.id); updItem(i, 'zonaNombre', z.nombre); updItem(i, 'zonaTarifa', z.tarifa); }
                          }}>
                            <option value="">Seleccione Zona...</option>
                            {zonas.map(z => <option key={z.id} value={z.id}>{z.nombre} - {fmt(z.tarifa)}</option>)}
                          </select>
                          <input className="input" style={{ padding: '6px 8px', fontSize: 12, flex: 1 }} placeholder="Detalle adicional..." value={it.notaAdicional} onChange={e => updItem(i, 'notaAdicional', e.target.value)} />
                        </div>
                      ) : (
                        <input className="input" style={{ padding: '6px 8px', fontSize: 12 }} value={it.descripcion} onChange={e => updItem(i, 'descripcion', e.target.value)} placeholder="Descripción del item" />
                      )}
                    </td>

                    <td style={{ padding: 8 }}><input className="input" type="number" min="0.01" step="0.01" style={{ padding: '6px 8px', fontSize: 12, textAlign: 'right' }} value={it.cantidad} onChange={e => updItem(i, 'cantidad', +e.target.value)} /></td>
                    
                    <td style={{ padding: 8 }}>
                      {it.tipo === 'instalacion' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <div style={{ fontSize: 10, color: '#64748b', textAlign: 'right' }}>Tarifa: {fmt(it.zonaTarifa)}</div>
                          <input className="input" type="number" step="0.01" style={{ padding: '6px 8px', fontSize: 12, textAlign: 'right' }} placeholder="+ Cargo Extra" value={it.cargoAdicional || ''} onChange={e => updItem(i, 'cargoAdicional', +e.target.value)} />
                        </div>
                      ) : (
                        <input className="input" type="number" step="0.01" style={{ padding: '6px 8px', fontSize: 12, textAlign: 'right' }} value={it.precioVenta} onChange={e => updItem(i, 'precioVenta', +e.target.value)} />
                      )}
                    </td>

                    <td style={{ padding: 8 }}><input className="input" type="number" step="0.01" style={{ padding: '6px 8px', fontSize: 12, textAlign: 'right' }} value={it.descuento || ''} onChange={e => updItem(i, 'descuento', +e.target.value)} /></td>
                    
                    <td style={{ padding: 8, textAlign: 'right', fontWeight: 700, fontSize: 13, color: '#0f172a' }}>{fmt(it.total)}</td>
                    <td style={{ padding: 8, textAlign: 'center' }}>
                      <button onClick={() => removeItem(i)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 700 }}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 24, fontSize: 14 }}>
            <div><span style={{ color: '#64748b' }}>Subtotal:</span> <strong style={{ color: '#0f172a' }}>{fmt(baseTotal)}</strong></div>
            <div><span style={{ color: '#64748b' }}>IVA (Aprox):</span> <strong style={{ color: '#0f172a' }}>{fmt(iva)}</strong></div>
            <div style={{ fontSize: 16 }}><span style={{ color: '#1581E3', fontWeight: 600 }}>Total Cotización:</span> <strong style={{ color: '#1581E3', fontSize: 18 }}>{fmt(grandTotal)}</strong></div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button className="btn-primary" onClick={guardar} disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Cotización'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
