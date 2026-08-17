import React from 'react';
import { fmt } from '@/lib/utils';
import { CartItem } from '../hooks/use-pos';

interface PosCartProps {
  cart: CartItem[];
  changeQty: (i: number, d: number) => void;
  changePrice: (i: number, val: string) => void;
  removeItem: (i: number) => void;
  clearCart?: () => void;
  
  clienteNit: string;
  setClienteNit: (n: string) => void;
  clienteNombre: string;
  setClienteNombre: (n: string) => void;
  setClienteId?: (id: number | null) => void;
  setClienteCorreo?: (c: string) => void;
  setNitStatus?: (s: 'idle' | 'found' | 'notfound') => void;
  nitStatus: 'idle' | 'found' | 'notfound';
  ejecutarBusquedaNit: () => void;
  setShowRegCliente: (b: boolean) => void;
  setRegForm?: any;
  clienteTieneCorreo: boolean;

  subtotal: number;
  descuento: number;
  impuesto: number;
  total: number;

  descPct: number;
  codigoDesc: string;
  setCodigoDesc: (c: string) => void;
  validarDescuento: () => void;

  setShowCobro: (b: boolean) => void;
}

export function PosCart({
  cart, changeQty, changePrice, removeItem, clearCart,
  clienteNit, setClienteNit, clienteNombre, setClienteNombre, setClienteId, setClienteCorreo, setNitStatus, nitStatus, ejecutarBusquedaNit, setShowRegCliente, setRegForm, clienteTieneCorreo,
  subtotal, descuento, impuesto, total,
  descPct, codigoDesc, setCodigoDesc, validarDescuento,
  setShowCobro
}: PosCartProps) {

  const [sugerenciasNombre, setSugerenciasNombre] = React.useState<any[]>([]);
  const [showSugerenciasNombre, setShowSugerenciasNombre] = React.useState(false);


  const lbl: React.CSSProperties = { display: 'block', fontSize: 10, fontWeight: 700, color: '#8a887e', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 4 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: '#f8fafc', borderLeft: '1.5px solid var(--ws-border, #d8d6cd)' }}>
      {/* HEADER CLIENTE */}
      <div style={{ padding: '16px 20px', background: '#fff', borderBottom: '1.5px solid var(--ws-border, #d8d6cd)', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={lbl}>NIT Cliente</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input 
                className="input" 
                placeholder="CF" 
                value={clienteNit} 
                onChange={e => {
                  const val = e.target.value.toUpperCase();
                  setClienteNit(val);
                  // When editing NIT, reset status and old client data
                  if (setNitStatus) setNitStatus('idle');
                  if (setClienteId) setClienteId(null);
                  if (setClienteCorreo) setClienteCorreo('');
                  if (val === 'CF' || val.trim() === '') {
                    setClienteNombre('Consumidor Final');
                  } else {
                    setClienteNombre('');
                  }
                }} 
                onKeyDown={e => e.key === 'Enter' && ejecutarBusquedaNit()} 
              />
              <button className="btn-secondary" onClick={ejecutarBusquedaNit} style={{ padding: '0 14px', fontWeight: 600 }}>Buscar</button>
            </div>
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <label style={lbl}>Nombre Cliente (escribe para buscar por nombre)</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input 
              className="input" 
              value={clienteNombre} 
              onChange={async e => {
                const val = e.target.value;
                setClienteNombre(val);
                if (val.trim().length >= 2 && nitStatus !== 'found') {
                  try {
                    const res = await fetch(`/api/clientes?buscar=${encodeURIComponent(val.trim())}`);
                    const data = await res.json();
                    if (Array.isArray(data) && data.length > 0) {
                      setSugerenciasNombre(data.slice(0, 5));
                      setShowSugerenciasNombre(true);
                    } else {
                      setSugerenciasNombre([]);
                      setShowSugerenciasNombre(false);
                    }
                  } catch {
                    setSugerenciasNombre([]);
                    setShowSugerenciasNombre(false);
                  }
                } else {
                  setSugerenciasNombre([]);
                  setShowSugerenciasNombre(false);
                }
              }} 
              disabled={nitStatus === 'found'} 
              placeholder="Escribe el nombre del cliente..."
              style={{ flex: 1 }} 
            />
            {nitStatus === 'notfound' && (
              <button 
                onClick={() => {
                  if (setRegForm) {
                    setRegForm({
                      nombre: '',
                      nit: clienteNit !== 'CF' ? clienteNit : '',
                      telefono: '',
                      direccion: '',
                      correo: '',
                    });
                  }
                  setShowRegCliente(true);
                }} 
                style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '0 14px', height: 38, cursor: 'pointer', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}
              >
                + Crear
              </button>
            )}
          </div>

          {showSugerenciasNombre && sugerenciasNombre.length > 0 && nitStatus !== 'found' && (
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
                maxHeight: 180,
                overflowY: 'auto',
                boxShadow: '0 10px 25px rgba(0,0,0,.15)',
                zIndex: 1000,
              }}
            >
              {sugerenciasNombre.map((c: any) => (
                <div
                  key={c.id}
                  onClick={() => {
                    setClienteNombre(c.nombre);
                    setClienteNit(c.nit || 'CF');
                    if (setClienteId) setClienteId(c.id);
                    if (setClienteCorreo) setClienteCorreo(c.email || '');
                    if (setNitStatus) setNitStatus('found');
                    setSugerenciasNombre([]);
                    setShowSugerenciasNombre(false);
                  }}
                  style={{
                    padding: '9px 14px',
                    borderBottom: '1px solid #f1f5f9',
                    cursor: 'pointer',
                    fontSize: 12,
                  }}
                  onMouseEnter={el => (el.currentTarget.style.background = '#f4f3ef')}
                  onMouseLeave={el => (el.currentTarget.style.background = 'none')}
                >
                  <div style={{ fontWeight: 600, color: '#18181b' }}>{c.nombre}</div>
                  <div style={{ fontSize: 11, color: '#8a887e', marginTop: 2 }}>
                    NIT: <strong>{c.nit || 'CF'}</strong> {c.telefono ? `· Tel: ${c.telefono}` : ''}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>


      {/* HEADER DE ITEMS CON BOTÓN LIMPIAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px 6px 20px', flexShrink: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Ítems Seleccionados ({cart.length})
        </span>
        {cart.length > 0 && clearCart && (
          <button
            onClick={clearCart}
            style={{
              background: '#fef2f2',
              color: '#dc2626',
              border: '1px solid #fecaca',
              borderRadius: 6,
              padding: '4px 12px',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
              lineHeight: 1.4,
            }}
          >
            Limpiar Lista
          </button>
        )}
      </div>

      {/* CART ITEMS */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 16px', minHeight: 0 }}>
        {cart.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: 40, fontSize: 14 }}>
            El carrito está vacío
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {cart.map((item, i) => (
              <div
                key={i}
                style={{
                  background: '#fff',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: 8,
                  padding: '10px 14px',
                  position: 'relative',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  transition: 'border-color 0.15s ease',
                }}
              >
                <button
                  onClick={() => removeItem(i)}
                  title="Eliminar producto"
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 700,
                    padding: '2px 6px',
                    lineHeight: 1,
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                  onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                >
                  ×
                </button>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', paddingRight: 20, lineHeight: 1.3, marginBottom: 8 }}>
                  {item.codigo ? <span style={{ color: '#64748b', fontWeight: 500, fontSize: 11 }}>[{item.codigo}] </span> : ''}
                  {item.nombre}
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', borderRadius: 6, overflow: 'hidden', border: '1px solid #cbd5e1', height: 28 }}>
                    <button onClick={() => changeQty(i, -1)} style={{ background: 'none', border: 'none', width: 26, height: 28, cursor: 'pointer', color: '#475569', fontWeight: 700, fontSize: 14 }}>-</button>
                    <div style={{ width: 30, textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{item.cantidad}</div>
                    <button onClick={() => changeQty(i, 1)} style={{ background: 'none', border: 'none', width: 26, height: 28, cursor: 'pointer', color: '#475569', fontWeight: 700, fontSize: 14 }}>+</button>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input 
                      type="number" 
                      value={item.precioUnitario} 
                      onChange={e => changePrice(i, e.target.value)}
                      style={{ width: 78, textAlign: 'right', padding: '4px 6px', fontSize: 12, border: '1px solid #cbd5e1', borderRadius: 6, background: item.tipo === 'libre' ? '#fff' : '#f8fafc' }}
                      disabled={item.tipo !== 'libre'}
                    />
                    <div style={{ fontWeight: 800, color: '#1581E3', fontSize: 14, minWidth: 70, textAlign: 'right' }}>
                      {fmt(item.subtotal)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TOTALES */}
      <div style={{ background: '#fff', borderTop: '1.5px solid var(--ws-border, #d8d6cd)', padding: 20, flexShrink: 0 }}>
        {/* Descuentos Globales / Cupones — Solo si la venta no posee descuento previo */}
        {descuento === 0 && descPct === 0 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input className="input" placeholder="Código de Cupón..." style={{ flex: 1, padding: '6px 10px', fontSize: 12 }} value={codigoDesc} onChange={e => setCodigoDesc(e.target.value)} />
            <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={validarDescuento}>Aplicar</button>
          </div>
        )}

        {/* Desglose de Cuentas Transparente */}
        {(() => {
          const baseSinIVA = Math.round((total / 1.05) * 100) / 100;
          const ivaMonto = Math.round((total - baseSinIVA) * 100) / 100;

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 12, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                <span>Subtotal (Base sin IVA):</span>
                <span style={{ fontWeight: 600 }}>{fmt(baseSinIVA)}</span>
              </div>

              {(descuento > 0 || descPct > 0) && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626', fontWeight: 600 }}>
                  <span>
                    {codigoDesc ? `Descuento Cupón (${codigoDesc.toUpperCase()}):` : descPct > 0 ? `Descuento (${descPct}%):` : 'Descuento Aplicado (Cotización/Promoción):'}
                  </span>
                  <span>- {fmt(descuento)}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#d97706', fontWeight: 600 }}>
                <span>IVA (5% Incluido):</span>
                <span>{fmt(ivaMonto)}</span>
              </div>
            </div>
          );
        })()}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16, borderTop: '2px dashed #e2e8f0', paddingTop: 12 }}>
          <div>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', display: 'block' }}>TOTAL A PAGAR</span>
            {descuento > 0 && <span style={{ fontSize: 10, color: '#16a34a', fontWeight: 600 }}>(Ahorro: {fmt(descuento)})</span>}
          </div>
          <span style={{ fontSize: 28, fontWeight: 900, color: '#16a34a', lineHeight: 1 }}>{fmt(total)}</span>
        </div>
        <button 
          onClick={() => setShowCobro(true)} 
          disabled={cart.length === 0}
          className="btn-primary" 
          style={{ width: '100%', height: 48, fontSize: 16, fontWeight: 700, opacity: cart.length === 0 ? .5 : 1 }}
        >
          Cobrar Ahora
        </button>
      </div>
    </div>
  );
}
