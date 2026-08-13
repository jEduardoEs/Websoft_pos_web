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

  const { form, items, loading, productos, zonas, buscarProd, baseTotal, ivaCalculado, grandTotal, isEditMode, clienteSugerencias, showClienteSugerencias } = state;
  const { setF, setItems, setBuscarProd, setShowClienteSugerencias } = setters;
  const { buscarNitCliente, buscarClienteNombre, seleccionarClienteSugerido, selProducto, addProductoToCotizacion, updItem, addItem, removeItem, guardar } = actions;

  const title = isDuplicate
    ? `Duplicar Cotización (${cotizacionInitial?.numero || ''})`
    : isEditMode
      ? `Editar Cotización ${cotizacionInitial?.numero || ''}`
      : 'Nueva Cotización';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', width: '100%', maxWidth: 1100, borderRadius: 'var(--ws-radius, 6px)', border: '1.5px solid var(--ws-border, #d8d6cd)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>

        {/* Header */}
        <div style={{ padding: '16px 24px', borderBottom: '1.5px solid var(--ws-border, #d8d6cd)', background: 'var(--ws-bg3, #f8f7f3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--ws-text, #18181b)' }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: 'var(--ws-text3, #8a887e)' }}>×</button>
        </div>

        {/* Body Scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Fila 1: Cliente y Datos */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: 'var(--ws-bg3, #f8f7f3)', padding: 16, borderRadius: 'var(--ws-radius, 6px)', border: '1.5px solid var(--ws-border, #d8d6cd)', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ws-text, #18181b)', borderBottom: '1px solid var(--ws-border, #d8d6cd)', paddingBottom: 8 }}>Datos del Cliente</div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
                <div>
                  <label className="label">NIT (Tab/Enter auto-carga)</label>
                  <input
                    className="input"
                    value={form.clienteNit}
                    onChange={e => setF('clienteNit', e.target.value)}
                    onBlur={e => buscarNitCliente(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && buscarNitCliente(form.clienteNit)}
                    placeholder="CF o NIT"
                  />
                </div>
                <div style={{ position: 'relative' }}>
                  <label className="label">Nombre / Razón Social <span style={{ color: 'red' }}>*</span></label>
                  <input
                    className="input"
                    value={form.clienteNombre}
                    onChange={e => buscarClienteNombre(e.target.value)}
                    placeholder="Escribe para buscar por nombre..."
                    onFocus={() => { if (clienteSugerencias && clienteSugerencias.length > 0) setShowClienteSugerencias(true); }}
                  />
                  {showClienteSugerencias && clienteSugerencias && clienteSugerencias.length > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        background: '#fff',
                        border: '1.5px solid #d8d6cd',
                        borderRadius: 8,
                        marginTop: 4,
                        maxHeight: 200,
                        overflowY: 'auto',
                        boxShadow: '0 10px 25px rgba(0,0,0,.15)',
                        zIndex: 1000,
                      }}
                    >
                      {clienteSugerencias.map((c: any) => (
                        <div
                          key={c.id}
                          onClick={() => seleccionarClienteSugerido(c)}
                          style={{
                            padding: '9px 14px',
                            borderBottom: '1px solid #f1f5f9',
                            cursor: 'pointer',
                            fontSize: 12,
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#f4f3ef')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                        >
                          <div style={{ fontWeight: 600, color: '#18181b' }}>{c.nombre}</div>
                          <div style={{ fontSize: 11, color: '#8a887e', marginTop: 2 }}>
                            NIT: <strong>{c.nit || 'CF'}</strong> {c.telefono ? `· Tel: ${c.telefono}` : ''} {c.email ? `· ${c.email}` : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                <div>
                  <label className="label">Dirección</label>
                  <input className="input" value={form.clienteDireccion} onChange={e => setF('clienteDireccion', e.target.value)} placeholder="Ej: Ciudad de Guatemala" />
                </div>
                <div>
                  <label className="label" style={{ fontWeight: 600, color: 'var(--ws-blue, #1581E3)' }}>Atendido por / Vendedor</label>
                  <input className="input" value={form.atencion || ''} onChange={e => setF('atencion', e.target.value)} placeholder="Nombre del vendedor" />
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--ws-bg3, #f8f7f3)', padding: 16, borderRadius: 'var(--ws-radius, 6px)', border: '1.5px solid var(--ws-border, #d8d6cd)', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ws-text, #18181b)', borderBottom: '1px solid var(--ws-border, #d8d6cd)', paddingBottom: 8 }}>Condiciones Comerciales</div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="label">Validez (Días)</label>
                  <input className="input" type="number" min="1" value={form.validezDias} onChange={e => setF('validezDias', e.target.value)} />
                </div>
                <div>
                  <label className="label">Tiempo de Instalación / Entrega</label>
                  <input className="input" value={form.tiempoInstalacion} onChange={e => setF('tiempoInstalacion', e.target.value)} placeholder="Ej: 3 a 5 días hábiles" />
                </div>
              </div>

              <div>
                <label className="label">Formas de Pago aceptadas</label>
                <input className="input" value={form.formaPago} onChange={e => setF('formaPago', e.target.value)} />
              </div>
            </div>
          </div>

          <div>
            <label className="label" style={{ fontWeight: 700, color: 'var(--ws-text, #18181b)' }}>Asunto / Descripción General</label>
            <input className="input" value={form.descripcion} onChange={e => setF('descripcion', e.target.value)} placeholder="Ej: Instalación Sistema de Cámaras de Seguridad y Control de Acceso" />
          </div>

          <hr style={{ border: 'none', borderTop: '1.5px solid var(--ws-border, #d8d6cd)' }} />

          {/* Fila 2: Items */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ws-text, #18181b)' }}>Líneas de Cotización</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => addItem('producto')} className="btn-ghost" style={{ padding: '6px 12px', fontSize: 12 }}>+ Producto Manual</button>
                <button type="button" onClick={() => addItem('servicio')} className="btn-ghost" style={{ padding: '6px 12px', fontSize: 12 }}>+ Servicio</button>
                <button type="button" onClick={() => addItem('instalacion')} className="btn-ghost" style={{ padding: '6px 12px', fontSize: 12 }}>+ Instalación</button>
              </div>
            </div>

            <div style={{ background: 'var(--ws-bg3, #f8f7f3)', padding: 12, borderRadius: 'var(--ws-radius, 6px)', border: '1.5px solid var(--ws-border, #d8d6cd)', marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ws-text2, #52524d)', marginBottom: 8 }}>Buscador rápido de inventario:</div>
              <input
                className="input"
                placeholder="Buscar por código o nombre... (clic en el resultado para agregarlo a la cotización)"
                value={buscarProd} onChange={e => setBuscarProd(e.target.value)}
              />
              {buscarProd && productos.length > 0 && (
                <div style={{ background: '#fff', border: '1.5px solid var(--ws-blue, #1581E3)', borderRadius: 'var(--ws-radius, 6px)', marginTop: 4, maxHeight: 180, overflowY: 'auto' }}>
                  {productos.map(p => (
                    <div key={p.id} onClick={() => { addProductoToCotizacion(p); setBuscarProd(''); }}
                      style={{ padding: '10px 14px', borderBottom: '1px solid var(--ws-border, #d8d6cd)', cursor: 'pointer', fontSize: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background .15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--ws-blue-light, #eaf3fd)')}
                      onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
                      <div>
                        <strong style={{ color: 'var(--ws-blue, #1581E3)' }}>{p.codigo || 'SIN-COD'}</strong> — <span style={{ fontWeight: 600, color: 'var(--ws-text, #18181b)' }}>{p.nombre}</span> <span style={{ fontSize: 11, color: 'var(--ws-text3, #8a887e)' }}>(Stock: {p.stock})</span>
                      </div>
                      <span style={{ fontWeight: 700, color: 'var(--ws-green, #2f6b3a)' }}>{fmt(p.precio)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 10 }}>
              <thead>
                <tr style={{ background: 'var(--ws-bg3, #f8f7f3)', fontSize: 11, color: 'var(--ws-text2, #52524d)', textTransform: 'uppercase' }}>
                  <th style={{ padding: 8, textAlign: 'left', width: '8%', borderBottom: '1.5px solid var(--ws-border, #d8d6cd)' }}>Tipo</th>
                  <th style={{ padding: 8, textAlign: 'left', width: '12%', borderBottom: '1.5px solid var(--ws-border, #d8d6cd)' }}>Código</th>
                  <th style={{ padding: 8, textAlign: 'left', borderBottom: '1.5px solid var(--ws-border, #d8d6cd)' }}>Descripción</th>
                  <th style={{ padding: 8, textAlign: 'right', width: '10%', borderBottom: '1.5px solid var(--ws-border, #d8d6cd)' }}>Cant.</th>
                  <th style={{ padding: 8, textAlign: 'right', width: '12%', borderBottom: '1.5px solid var(--ws-border, #d8d6cd)' }}>Precio U.</th>
                  <th style={{ padding: 8, textAlign: 'right', width: '12%', borderBottom: '1.5px solid var(--ws-border, #d8d6cd)' }}>Desc.</th>
                  <th style={{ padding: 8, textAlign: 'right', width: '12%', borderBottom: '1.5px solid var(--ws-border, #d8d6cd)' }}>Total</th>
                  <th style={{ padding: 8, textAlign: 'center', width: '5%', borderBottom: '1.5px solid var(--ws-border, #d8d6cd)' }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--ws-border, #d8d6cd)' }}>
                    <td style={{ padding: 8 }}>
                      <span style={{ fontSize: 10, padding: '2px 6px', background: it.tipo === 'producto' ? '#eaf3fd' : it.tipo === 'servicio' ? '#faf1e3' : '#eef5ee', border: '1px solid #d8d6cd', borderRadius: 4, fontWeight: 700 }}>
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
                          <div style={{ fontSize: 10, color: 'var(--ws-text2, #52524d)', textAlign: 'right' }}>Tarifa: {fmt(it.zonaTarifa)}</div>
                          <input className="input" type="number" step="0.01" style={{ padding: '6px 8px', fontSize: 12, textAlign: 'right' }} placeholder="+ Cargo Extra" value={it.cargoAdicional || ''} onChange={e => updItem(i, 'cargoAdicional', +e.target.value)} />
                        </div>
                      ) : (
                        <input className="input" type="number" step="0.01" style={{ padding: '6px 8px', fontSize: 12, textAlign: 'right' }} value={it.precioVenta} onChange={e => updItem(i, 'precioVenta', +e.target.value)} />
                      )}
                    </td>

                    <td style={{ padding: 8 }}><input className="input" type="number" step="0.01" style={{ padding: '6px 8px', fontSize: 12, textAlign: 'right' }} value={it.descuento || ''} onChange={e => updItem(i, 'descuento', +e.target.value)} /></td>

                    <td style={{ padding: 8, textAlign: 'right', fontWeight: 700, fontSize: 13, color: 'var(--ws-text, #18181b)' }}>{fmt(it.total)}</td>
                    <td style={{ padding: 8, textAlign: 'center' }}>
                      <button onClick={() => removeItem(i)} style={{ background: 'none', border: 'none', color: 'var(--ws-red, #b13a2e)', cursor: 'pointer', fontWeight: 700 }}></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Anotaciones y Aclaraciones para el Cliente */}
          <div style={{ background: 'var(--ws-bg3, #f8f7f3)', border: '1.5px solid var(--ws-border, #d8d6cd)', borderRadius: 'var(--ws-radius, 6px)', padding: 14 }}>
            <label className="label" style={{ fontWeight: 700, color: 'var(--ws-text, #18181b)', fontSize: 13, marginBottom: 6 }}>
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
        <div style={{ padding: '16px 24px', background: 'var(--ws-bg3, #f8f7f3)', borderTop: '1.5px solid var(--ws-border, #d8d6cd)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 20, fontSize: 13, alignItems: 'center' }}>
            <div><span style={{ color: 'var(--ws-text2, #52524d)' }}>Subtotal:</span> <strong style={{ color: 'var(--ws-text, #18181b)' }}>{fmt(baseTotal)}</strong></div>
            <div>
              <span style={{ color: 'var(--ws-text2, #52524d)' }}>IVA (Incluido):</span> <strong style={{ color: 'var(--ws-text, #18181b)' }}>{fmt(ivaCalculado)}</strong>
            </div>
            <div style={{ fontSize: 16 }}><span style={{ color: 'var(--ws-blue, #1581E3)', fontWeight: 600 }}>Total Final:</span> <strong style={{ color: 'var(--ws-blue, #1581E3)', fontSize: 18 }}>{fmt(grandTotal)}</strong></div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn-ghost" onClick={onClose}>Cancelar</button>
            <button className="btn-primary" onClick={guardar} disabled={loading}>
              {loading ? 'Guardando...' : isEditMode ? 'Guardar Cambios' : isDuplicate ? 'Crear Duplicado' : 'Guardar Cotización'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
