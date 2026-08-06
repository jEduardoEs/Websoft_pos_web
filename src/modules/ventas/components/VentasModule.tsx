'use client';

import React, { useState, useEffect } from 'react';
import { useVentas } from '@/modules/ventas/hooks/use-ventas';
import { VentasTable } from '@/modules/ventas/components/VentasTable';
import { VentaDetalleModal } from '@/modules/ventas/components/VentaDetalleModal';
import { Venta } from '@/modules/ventas/types/venta';

const lbl: React.CSSProperties = { display: 'block', fontSize: 10, fontWeight: 700, color: '#8a887e', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 4 };

export function VentasModule() {
  const { ventas, loading, error, fetchVentas, anularVenta } = useVentas();
  
  const [fi, setFi] = useState(new Date().toISOString().slice(0, 10));
  const [ff, setFf] = useState(new Date().toISOString().slice(0, 10));
  const [estado, setEstado] = useState('');
  const [buscar, setBuscar] = useState('');
  
  const [selected, setSelected] = useState<Venta | null>(null);

  useEffect(() => {
    fetchVentas({ fechaIni: fi, fechaFin: ff, estado, buscar });
  }, [fi, ff, estado, buscar, fetchVentas]);

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', height: '100%', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>Historial de Ventas</h1>
          <p style={{ color: '#64748b', marginTop: 4 }}>Administración de facturas y documentos de venta.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button 
            onClick={() => fetchVentas({ fechaIni: fi, fechaFin: ff, estado, buscar })} 
            className="btn-secondary" 
            disabled={loading}
          >
            {loading ? 'Cargando...' : '↻ Actualizar'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 14, background: '#fff', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={lbl}>Buscar</label>
          <input className="input" placeholder="No. Factura, Cliente o NIT" value={buscar} onChange={e => setBuscar(e.target.value)} />
        </div>
        <div>
          <label style={lbl}>Fecha Inicio</label>
          <input type="date" className="input" value={fi} onChange={e => setFi(e.target.value)} />
        </div>
        <div>
          <label style={lbl}>Fecha Fin</label>
          <input type="date" className="input" value={ff} onChange={e => setFf(e.target.value)} />
        </div>
        <div>
          <label style={lbl}>Estado</label>
          <select className="input" value={estado} onChange={e => setEstado(e.target.value)}>
            <option value="">(No anuladas)</option>
            <option value="completada">Completada</option>
            <option value="anulada">Anulada</option>
          </select>
        </div>
      </div>

      {error && <div style={{ color: '#ef4444', background: '#fef2f2', padding: 12, borderRadius: 8 }}>{error}</div>}

      <VentasTable 
        ventas={ventas} 
        onView={v => setSelected(v)} 
        onAnular={anularVenta} 
      />

      {selected && (
        <VentaDetalleModal 
          venta={selected} 
          onClose={() => setSelected(null)} 
        />
      )}
    </div>
  );
}
