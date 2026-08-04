import React from 'react';
import { fmt } from '@/lib/utils';
import { CartItem } from '../hooks/use-pos';

interface PosCartProps {
  cart: CartItem[];
  changeQty: (i: number, d: number) => void;
  changePrice: (i: number, val: string) => void;
  removeItem: (i: number) => void;
  
  clienteNit: string;
  setClienteNit: (n: string) => void;
  clienteNombre: string;
  setClienteNombre: (n: string) => void;
  nitStatus: 'idle' | 'found' | 'notfound';
  ejecutarBusquedaNit: () => void;
  setShowRegCliente: (b: boolean) => void;
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
  cart, changeQty, changePrice, removeItem,
  clienteNit, setClienteNit, clienteNombre, setClienteNombre, nitStatus, ejecutarBusquedaNit, setShowRegCliente, clienteTieneCorreo,
  subtotal, descuento, impuesto, total,
  descPct, codigoDesc, setCodigoDesc, validarDescuento,
  setShowCobro
}: PosCartProps) {

  const lbl: React.CSSProperties = { display: 'block', fontSize: 10, fontWeight: 700, color: '#8a887e', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 4 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      {/* HEADER CLIENTE */}
      <div style={{ padding: '14px 16px', background: '#fff', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 10 }}>
          <div style={{ flex: 1 }}>
            <label style={lbl}>NIT Cliente</label>
            <div style={{ display: 'flex', gap: 6 }}>
              <input 
                className="input" 
                placeholder="CF" 
                value={clienteNit} 
                onChange={e => {
                  const val = e.target.value.toUpperCase();
                  setClienteNit(val);
                  if (val.length < 3 || val === 'CF') setClienteNombre('Consumidor Final');
                }} 
                onKeyDown={e => e.key === 'Enter' && ejecutarBusquedaNit()} 
              />
              <button className="btn-secondary" onClick={ejecutarBusquedaNit} style={{ padding: '0 12px' }}>🔍</button>
            </div>
          </div>
        </div>

        <div>
          <label style={lbl}>Nombre Cliente</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input 
              className="input" 
              value={clienteNombre} 
              onChange={e => setClienteNombre(e.target.value)} 
              disabled={nitStatus === 'found'} 
              style={{ flex: 1 }} 
            />
            {nitStatus === 'notfound' && (
              <button 
                onClick={() => setShowRegCliente(true)} 
                style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '0 12px', height: 38, cursor: 'pointer', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}
              >
                + Crear
              </button>
            )}
            {nitStatus === 'found' && clienteTieneCorreo && (
              <span title="Cliente tiene correo para factura electrónica" style={{ fontSize: 16 }}>📧</span>
            )}
            {nitStatus === 'found' && !clienteTieneCorreo && (
              <span title="Sin correo configurado" style={{ fontSize: 16, opacity: 0.4 }}>🚫📧</span>
            )}
          </div>
        </div>
      </div>

      {/* CART ITEMS */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 10 }}>
        {cart.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: 40, fontSize: 14 }}>
            El carrito está vacío
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {cart.map((item, i) => (
              <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 12, position: 'relative' }}>
                <button onClick={() => removeItem(i)} style={{ position: 'absolute', top: -8, right: -8, background: '#ef4444', color: '#fff', border: 'none', width: 22, height: 22, borderRadius: '50%', cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,.1)' }}>
                  ✕
                </button>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', paddingRight: 16, lineHeight: 1.2, marginBottom: 8 }}>
                  {item.codigo ? <span style={{ color: '#64748b', fontWeight: 500 }}>[{item.codigo}] </span> : ''}
                  {item.nombre}
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', borderRadius: 6, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                    <button onClick={() => changeQty(i, -1)} style={{ background: 'none', border: 'none', width: 28, height: 28, cursor: 'pointer', color: '#64748b', fontWeight: 700 }}>-</button>
                    <div style={{ width: 32, textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{item.cantidad}</div>
                    <button onClick={() => changeQty(i, 1)} style={{ background: 'none', border: 'none', width: 28, height: 28, cursor: 'pointer', color: '#64748b', fontWeight: 700 }}>+</button>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <input 
                      type="number" 
                      value={item.precioUnitario} 
                      onChange={e => changePrice(i, e.target.value)}
                      style={{ width: 70, textAlign: 'right', padding: '4px 6px', fontSize: 12, border: '1px solid #e2e8f0', borderRadius: 4, background: item.tipo === 'libre' ? '#fff' : '#f8fafc' }}
                      disabled={item.tipo !== 'libre'}
                    />
                    <div style={{ fontWeight: 800, color: '#2563eb', fontSize: 14 }}>
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
      <div style={{ background: '#fff', borderTop: '1px solid #e2e8f0', padding: 16 }}>
        {/* Descuentos Globales */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input className="input" placeholder="Cupón..." style={{ flex: 1, padding: '6px 10px', fontSize: 12 }} value={codigoDesc} onChange={e => setCodigoDesc(e.target.value)} />
          <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={validarDescuento}>Aplicar</button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13, color: '#64748b' }}>
          <span>Subtotal</span>
          <span>{fmt(subtotal)}</span>
        </div>
        {descPct > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13, color: '#ef4444' }}>
            <span>Descuento ({descPct}%)</span>
            <span>- {fmt(descuento)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 13, color: '#64748b' }}>
          <span>Impuestos</span>
          <span>Incluido en Total</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16, borderTop: '2px dashed #e2e8f0', paddingTop: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>TOTAL</span>
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
