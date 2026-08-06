'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useCaja } from '@/modules/caja/hooks/use-caja';
import { CajaResumenPanel } from '@/modules/caja/components/CajaResumenPanel';
import { CajaMovimientosPanel } from '@/modules/caja/components/CajaMovimientosPanel';
import { CajaCerrarPanel } from '@/modules/caja/components/CajaCerrarPanel';
import { fmtDateTime } from '@/lib/utils';

export function CajaModule() {
  const { data, loading, fetchCaja, abrirCaja, registrarMovimiento, cerrarCaja } = useCaja();
  const [tab, setTab] = useState<'resumen' | 'movimientos' | 'cerrar'>('resumen');
  
  const [fondoInicial, setFondoInicial] = useState('');
  const [notasApertura, setNotasApertura] = useState('');
  const [cierreResult, setCierreResult] = useState<any>(null);

  useEffect(() => {
    fetchCaja();
  }, [fetchCaja]);

  const handleAbrir = async () => {
    try {
      await abrirCaja({
        fondoInicial: parseFloat(fondoInicial) || 0,
        notas: notasApertura
      });
      toast.success('Caja abierta exitosamente');
      setFondoInicial('');
    } catch (e: any) {
      toast.error(e.message || 'Error al abrir caja');
    }
  };

  const handleRegistrarMovimiento = async (tipo: 'inyeccion' | 'retiro', monto: number, motivo: string) => {
    try {
      await registrarMovimiento({ tipo, monto, motivo });
      toast.success(tipo === 'inyeccion' ? 'Capital agregado' : 'Retiro registrado');
    } catch (e: any) {
      toast.error(e.message || 'Error al registrar movimiento');
    }
  };

  const handleCerrarCaja = async (efectivoContado: number, tarjetaBaucher: number, transferenciaContada: number, notas: string) => {
    try {
      const resultado = await cerrarCaja({
        efectivoContado,
        tarjetaBaucher,
        transferenciaContada,
        notas
      });
      toast.success('Caja cerrada correctamente');
      setCierreResult(resultado);
    } catch (e: any) {
      toast.error(e.message || 'Error al cerrar caja');
    }
  };

  const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 };

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 10 }}>
            Control de Caja
            {data?.activa ? (
              <span className="badge-green">Abierta</span>
            ) : (
              <span className="badge-gray">Cerrada</span>
            )}
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>
            {data?.activa 
              ? `Turno actual abierto el ${fmtDateTime(data.activa.fecha)} por ${data.activa.usuarioNombre}`
              : 'No hay turno activo. Abre la caja para iniciar operaciones.'}
          </p>
        </div>
      </div>

      {!data?.activa && !cierreResult && (
        <div className="card" style={{ padding: 40, textAlign: 'center', maxWidth: 500, margin: '40px auto' }}>
          <div style={{ fontSize: 40, marginBottom: 14 }}></div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Apertura de Caja</h2>
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>Ingresa el fondo de cambio inicial para comenzar a facturar.</p>
          
          <div style={{ textAlign: 'left', marginBottom: 14 }}>
            <label style={lbl}>Fondo inicial (Q)</label>
            <input className="input" type="number" min="0" step="0.01" value={fondoInicial} onChange={e => setFondoInicial(e.target.value)} placeholder="0.00" />
          </div>
          <div style={{ textAlign: 'left', marginBottom: 24 }}>
            <label style={lbl}>Notas (opcional)</label>
            <input className="input" value={notasApertura} onChange={e => setNotasApertura(e.target.value)} placeholder="Ej: Billetes de baja denominacion" />
          </div>

          <button className="btn-primary" onClick={handleAbrir} disabled={loading} style={{ width: '100%', padding: 14, fontSize: 15 }}>
            Iniciar Turno
          </button>
        </div>
      )}

      {data?.activa && (
        <>
          <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', gap: 20 }}>
            {[
              { id: 'resumen', label: ' Resumen' },
              { id: 'movimientos', label: ' Movimientos' },
              { id: 'cerrar', label: ' Arqueo y Cierre' },
            ].map(({ id, label }) => (
              <button key={id} onClick={() => setTab(id as any)} style={{
                background: 'none', border: 'none', fontSize: 14, fontWeight: 600, padding: '10px 4px', cursor: 'pointer',
                color: tab === id ? '#2563eb' : '#64748b', borderBottom: tab === id ? '2px solid #2563eb' : '2px solid transparent'
              }}>
                {label}
              </button>
            ))}
          </div>

          {tab === 'resumen' && <CajaResumenPanel data={data} />}
          {tab === 'movimientos' && <CajaMovimientosPanel data={data} loading={loading} onRegistrarMovimiento={handleRegistrarMovimiento} />}
          {tab === 'cerrar' && <CajaCerrarPanel data={data} loading={loading} onCerrarCaja={handleCerrarCaja} cierreResult={cierreResult} />}
        </>
      )}

      {!data?.activa && cierreResult && (
        <CajaCerrarPanel data={data as any} loading={loading} onCerrarCaja={() => {}} cierreResult={cierreResult} />
      )}
    </div>
  );
}
