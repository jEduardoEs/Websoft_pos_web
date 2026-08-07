import React from 'react';
import { fmt } from '@/lib/utils';
import { useCotizacionForm } from '../hooks/use-cotizacion-form';

interface CotizacionFormModalProps {
  onClose: () => void;
  onSuccess: () => void;
  cotizacionInitial?: any;
  isDuplicate?: boolean;
}

export function CotizacionFormModal({ onClose, onSuccess, cotizacionInitial, isDuplicate }: CotizacionFormModalProps) {
  const { state, setters, actions } = useCotizacionForm(() => {
    onSuccess();
    onClose();
  }, cotizacionInitial, isDuplicate);

  const { form, items, loading, productos, zonas, buscarProd, baseTotal, ivaCalculado, grandTotal, isEditMode } = state;
  const { setF, setItems, setBuscarProd } = setters;
  const { buscarNitCliente, selProducto, addProductoToCotizacion, updItem, addItem, removeItem, guardar } = actions;

  const title = isDuplicate
    ? `Duplicar Cotización (${cotizacionInitial?.numero || ''})`
    : isEditMode
      ? `Editar Cotización ${cotizacionInitial?.numero || ''}`
      : 'Nueva Cotización';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', width: '100%', maxWidth: 1100, borderRadius: 12, display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>

        {/* Header */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#0f172a' }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#64748b' }}>×</button>
        </div>

        {/* Body Scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

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
                  <label className="label">Nombre / Razón Social <span style={{ color: 'red' }}>*</span></label>
                  <input className="input" value={form.clienteNombre} onChange={e => setF('clienteNombre', e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="label">Teléfono (8 dígitos)</label>
                  <input className="input" type="tel" maxLength={8} value={form.clienteTelefono || ''} onChange={e => setF('clienteTelefono', e.target.value.replace(/\D/g, '').slice(0, 8))} placeholder="Ej: 55554444" />
                </div>
                <div>
                  <label className="label">Correo Electrónico (para enviar PDF)</label>
                  <input className="input" type="email" value={form.clienteCorreo || ''} onChange={e => setF('clienteCorreo', e.target.value)} placeholder="Ej: cliente@correo.com" />
                </div>
              </div>

              <div>
                <label className="label">Dirección</label>
                <input className="input" value={form.clienteDireccion} onChange={e => setF('clienteDireccion', e.target.value)} />
              </div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>Condiciones Comerciales e Impuestos</div>

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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="label">Tiempo de Instalación / Entrega</label>
                  <input className="input" value={form.tiempoInstalacion} onChange={e => setF('tiempoInstalacion', e.target.value)} placeholder="Ej: 3 a 5 días hábiles" />
                </div>
                <div>
                  <label className="label">Tratamiento del IVA</label>
                  <select className="input" value={form.tipoIva} onChange={e => setF('tipoIva', e.target.value)}>
                    <option value="incluido">Precios Incluyen IVA (Precios Netos)</option>
                    <option value="12">Agregar 12% IVA (Régimen General)</option>
                    <option value="5">Agregar 5% IVA (Pequeño Contribuyente)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Formas de Pago aceptadas</label>
                <input className="input" value={form.formaPago} onChange={e => setF('formaPago', e.target.value)} />
              </div>
            </div>
          </div>

          <div>
            <label className="label" style={{ fontWeight: 700, color: '#1e293b' }}>Asunto / Descripción General</label>
            <input className="input" value={form.descripcion} onChange={e => setF('descripcion', e.target.value)} placeholder="Ej: Instalación Sistema de Cámaras de Seguridad y Control de Acceso" />
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
                placeholder="Buscar por código o nombre... (clic en el resultado para agregarlo a la cotización)"
                value={buscarProd} onChange={e => setBuscarProd(e.target.value)}
              />
              {buscarProd && productos.length > 0 && (
                <div style={{ background: '#fff', border: '1.5px solid #2563eb', borderRadius: 6, marginTop: 4, maxHeight: 180, overflowY: 'auto', boxShadow: '0 8px 20px rgba(0,0,0,0.12)' }}>
                  {productos.map(p => (
                    <div key={p.id} onClick={() => { addProductoToCotizacion(p); setBuscarProd(''); }}
                      style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', fontSize: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background .15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#eff6ff')}
                      onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
                      <div>
                        <strong style={{ color: '#2563eb' }}>{p.codigo || 'SIN-COD'}</strong> — <span style={{ fontWeight: 600, color: '#0f172a' }}>{p.nombre}</span> <span style={{ fontSize: 11, color: '#64748b' }}>(Stock: {p.stock})</span>
                      </div>
                      <span style={{ fontWeight: 700, color: '#16a34a' }}>{fmt(p.precio)}</span>
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

                    <td style={{ padding: 8 }}><input className="input" type="number" min="0.01" step="any" style={{ padding: '6px 8px', fontSize: 12, textAlign: 'right' }} value={it.cantidad} onChange={e => updItem(i, 'cantidad', +e.target.value)} /></td>

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

          {/* Anotaciones y Aclaraciones para el Cliente */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 14 }}>
            <label className="label" style={{ fontWeight: 700, color: '#1e293b', fontSize: 13, marginBottom: 6 }}>
              Anotaciones y Aclaraciones Importantes para el Cliente (Aparecerán destacadas en el PDF)
            </label>
            <textarea
              className="input"
              rows={3}
              value={form.notas}
              onChange={e => setF('notas', e.target.value)}
              placeholder="Ej: Garantía de 1 año en equipos. Incluye configuración inicial de app móvil. No incluye cableado estructurado adicional..."
              style={{ resize: 'vertical', width: '100%' }}
            />
          </div>

        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 20, fontSize: 13, alignItems: 'center' }}>
            <div><span style={{ color: '#64748b' }}>Subtotal:</span> <strong style={{ color: '#0f172a' }}>{fmt(baseTotal)}</strong></div>
            <div>
              <span style={{ color: '#64748b' }}>
                {form.tipoIva === '12' ? 'IVA (+12%):' : form.tipoIva === '5' ? 'IVA (+5%):' : 'IVA (Incluido):'}
              </span> <strong style={{ color: '#0f172a' }}>{fmt(ivaCalculado)}</strong>
            </div>
            <div style={{ fontSize: 16 }}><span style={{ color: '#1581E3', fontWeight: 600 }}>Total Final:</span> <strong style={{ color: '#1581E3', fontSize: 18 }}>{fmt(grandTotal)}</strong></div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button className="btn-primary" onClick={guardar} disabled={loading}>
              {loading ? 'Guardando...' : isEditMode ? 'Guardar Cambios' : isDuplicate ? 'Crear Duplicado' : 'Guardar Cotización'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
