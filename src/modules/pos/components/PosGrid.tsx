import React from 'react';
import { fmt } from '@/lib/utils';
import { PosProducto, PosCotizacion } from '../hooks/use-pos';

interface PosGridProps {
  tab: 'inventario' | 'cotizacion' | 'libre';
  setTab: (t: 'inventario' | 'cotizacion' | 'libre') => void;
  felActivo: boolean;
  
  // Inventario
  buscar: string;
  setBuscar: (s: string) => void;
  searchRef: React.RefObject<HTMLInputElement>;
  productos: PosProducto[];
  addInventario: (p: PosProducto) => void;

  // Cotización
  buscarCot: string;
  setBuscarCot: (s: string) => void;
  cotizaciones: PosCotizacion[];
  cargarCotizacion: (c: PosCotizacion) => void;

  // Libre
  libreForm: { codigo: string; nombre: string; precio: string; cantidad: string };
  setLibreForm: React.Dispatch<React.SetStateAction<{ codigo: string; nombre: string; precio: string; cantidad: string }>>;
  addLibre: () => void;
}

export function PosGrid({
  tab, setTab, felActivo,
  buscar, setBuscar, searchRef, productos, addInventario,
  buscarCot, setBuscarCot, cotizaciones, cargarCotizacion,
  libreForm, setLibreForm, addLibre
}: PosGridProps) {

  const tabStyle = (t: string) => ({
    padding: '7px 14px', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12,
    fontWeight: 600, fontFamily: 'inherit',
    background: tab === t ? '#2563eb' : '#f8fafc',
    color: tab === t ? '#fff' : '#64748b',
    transition: 'all .15s',
  });

  const cotFiltradas = cotizaciones.filter(c =>
    !buscarCot || c.numero.toLowerCase().includes(buscarCot.toLowerCase()) || c.clienteNombre.toLowerCase().includes(buscarCot.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: '1px solid #e2e8f0', background: '#fff' }}>
      <div style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 6, background: '#f8fafc', alignItems: 'center' }}>
        <button style={tabStyle('inventario')} onClick={() => setTab('inventario')}>Inventario</button>
        <button style={tabStyle('cotizacion')} onClick={() => setTab('cotizacion')}>Desde Cotización</button>
        <button style={tabStyle('libre')} onClick={() => setTab('libre')}>Línea Libre</button>
        {felActivo && (
          <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '3px 8px', borderRadius: 10 }}>
            FEL activo
          </span>
        )}
      </div>

      {/* INVENTARIO */}
      {tab === 'inventario' && (
        <>
          <div style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0' }}>
            <input 
              ref={searchRef} 
              className="input" 
              placeholder="Buscar o escanear código de barras..." 
              value={buscar} 
              onChange={e => setBuscar(e.target.value)} 
              autoFocus 
            />
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 10, display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: 8, alignContent: 'start' }}>
            {productos.map(p => (
              <div 
                key={p.id} 
                onClick={() => addInventario(p)} 
                style={{ border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '8px', textAlign: 'center', cursor: p.stock <= 0 ? 'not-allowed' : 'pointer', opacity: p.stock <= 0 ? .45 : 1, background: '#fff', transition: 'all .15s' }}
              >
                {p.imagenUrl
                  ? <img src={p.imagenUrl} alt={p.nombre} style={{ width: '100%', height: 70, objectFit: 'contain', borderRadius: 6, marginBottom: 4 }} />
                  : <div style={{ width: '100%', height: 60, background: '#f8fafc', borderRadius: 6, marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}></div>}
                <div style={{ fontSize: 9, color: '#94a3b8', marginBottom: 1 }}>{p.codigo}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#0f172a', marginBottom: 3, lineHeight: 1.3 }}>{p.nombre}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#2563eb' }}>{fmt(p.precio)}</div>
                <div style={{ fontSize: 9, color: p.stock <= 5 ? '#d97706' : '#64748b', marginTop: 2 }}>{p.stock <= 0 ? 'Sin stock' : `${p.stock} uds`}</div>
              </div>
            ))}
            {productos.length === 0 && <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: '#94a3b8' }}>Sin productos</div>}
          </div>
        </>
      )}

      {/* COTIZACION */}
      {tab === 'cotizacion' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
          <p style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>Selecciona una cotización para cargarla al carrito.</p>
          <input className="input" placeholder="Buscar cotización..." value={buscarCot} onChange={e => setBuscarCot(e.target.value)} style={{ marginBottom: 12 }} />
          {cotFiltradas.length === 0
            ? <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Sin cotizaciones aceptadas o pendientes</div>
            : cotFiltradas.map(c => (
              <div 
                key={c.id} 
                onClick={() => cargarCotizacion(c)} 
                style={{ border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '12px 16px', marginBottom: 8, cursor: 'pointer', transition: 'all .15s', background: '#fff' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, color: '#2563eb', fontSize: 14 }}>{c.numero}</span>
                  <span style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>{fmt(c.total)}</span>
                </div>
                <div style={{ fontSize: 12, color: '#475569', marginBottom: 4 }}>{c.clienteNombre}</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>{c.items?.length || 0} items</div>
              </div>
            ))}
        </div>
      )}

      {/* LINEA LIBRE */}
      {tab === 'libre' && (
        <div style={{ flex: 1, padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: 12, fontSize: 12, color: '#78350f' }}>
            Agrega servicios o productos con precio especial. No descuentan stock.
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Código (opcional)</label>
            <input className="input" value={libreForm.codigo} onChange={e => setLibreForm(p => ({ ...p, codigo: e.target.value }))} placeholder="INST-001" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Descripción *</label>
            <input className="input" value={libreForm.nombre} onChange={e => setLibreForm(p => ({ ...p, nombre: e.target.value }))} placeholder="Ej: Instalación CCTV, Servicio técnico..." />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Precio Unit. *</label>
              <input type="number" className="input" value={libreForm.precio} onChange={e => setLibreForm(p => ({ ...p, precio: e.target.value }))} placeholder="0.00" />
            </div>
            <div style={{ width: 80 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Cant.</label>
              <input type="number" className="input" value={libreForm.cantidad} onChange={e => setLibreForm(p => ({ ...p, cantidad: e.target.value }))} />
            </div>
          </div>
          <button onClick={addLibre} className="btn-primary" style={{ marginTop: 10, width: '100%' }}>Agregar al Carrito</button>
        </div>
      )}
    </div>
  );
}
