'use client';

import React, { useState, useEffect } from 'react';
import { useVentas } from '@/modules/ventas/hooks/use-ventas';
import { VentasTable } from '@/modules/ventas/components/VentasTable';
import { VentaDetalleModal } from '@/modules/ventas/components/VentaDetalleModal';
import { Venta } from '@/modules/ventas/types/venta';



export function VentasModule() {
  const { ventas, loading, error, fetchVentas, anularVenta } = useVentas();
  
  const [fi, setFi] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [ff, setFf] = useState(() => new Date().toISOString().slice(0, 10));

  const [estado, setEstado] = useState('');
  const [buscar, setBuscar] = useState('');
  
  const [selected, setSelected] = useState<Venta | null>(null);

  useEffect(() => {
    fetchVentas({ fechaIni: fi, fechaFin: ff, estado, buscar });
  }, [fi, ff, estado, buscar, fetchVentas]);

  return (
    <div className="page-wrap">
      <div className="page-header">
        <div>
          <h1>Historial de Ventas</h1>
          <p>Administracion de facturas y documentos de venta.</p>
        </div>
        <button
          onClick={() => fetchVentas({ fechaIni: fi, fechaFin: ff, estado, buscar })}
          className="btn-ghost btn-sm"
          disabled={loading}
        >
          {loading ? 'Cargando...' : 'Actualizar'}
        </button>
      </div>

      <div className="card" style={{ padding: 14 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label className="lbl">Buscar</label>
            <input className="input" placeholder="No. Factura, Cliente o NIT" value={buscar} onChange={e => setBuscar(e.target.value)} />
          </div>
          <div>
            <label className="lbl">Fecha Inicio</label>
            <input type="date" className="input" value={fi} onChange={e => setFi(e.target.value)} />
          </div>
          <div>
            <label className="lbl">Fecha Fin</label>
            <input type="date" className="input" value={ff} onChange={e => setFf(e.target.value)} />
          </div>
          <div>
            <label className="lbl">Estado</label>
            <select className="input" value={estado} onChange={e => setEstado(e.target.value)}>
              <option value="">(No anuladas)</option>
              <option value="completada">Completada</option>
              <option value="anulada">Anulada</option>
            </select>
          </div>
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
