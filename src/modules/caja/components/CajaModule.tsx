'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useCaja } from '@/modules/caja/hooks/use-caja';
import { CajaResumenPanel } from '@/modules/caja/components/CajaResumenPanel';
import { CajaMovimientosPanel } from '@/modules/caja/components/CajaMovimientosPanel';
import { CajaCerrarPanel } from '@/modules/caja/components/CajaCerrarPanel';
import { fmt, fmtDateTime } from '@/lib/utils';

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
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Control de Caja</h1>
        <p style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>Apertura, movimientos, validación y cierre de turno</p>
      </div>

      {/* CAJA CERRADA */}
      {!data?.activa ? (
        <div className="card" style={{ padding: 28, maxWidth: 440 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#dc2626' }} />
            <span style={{ fontSize: 15, fontWeight: 700, color: '#dc2626' }}>Caja Cerrada</span>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={lbl}>Fondo inicial (efectivo con que abre la caja)</label>
            <input className="input" type="number" min="0" step="0.01" value={fondoInicial} onChange={e => setFondoInicial(e.target.value)} placeholder="Q 0.00" style={{ fontSize: 16 }} />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={lbl}>Notas</label>
            <input className="input" value={notasApertura} onChange={e => setNotasApertura(e.target.value)} placeholder="Opcional" />
          </div>
          <button className="btn-success" style={{ width: '100%', padding: 13, fontSize: 15 }} onClick={handleAbrir} disabled={loading}>
            {loading ? 'Abriendo...' : 'Abrir Caja'}
          </button>
        </div>
      ) : (
        <>
          {/* Status bar */}
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#16a34a', boxShadow: '0 0 0 3px rgba(22,163,74,.2)' }} />
              <span style={{ fontWeight: 700, color: '#16a34a', fontSize: 14 }}>Caja Abierta</span>
              <span style={{ fontSize: 12, color: '#64748b' }}>· desde {fmtDateTime(data.activa.fecha)} · {data.activa.usuarioNombre}</span>
            </div>
            <span style={{ fontWeight: 700, color: '#16a34a' }}>Fondo inicial: {fmt(data.activa.fondoInicial)}</span>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 2, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 4, width: 'fit-content' }}>
            {([
              ['resumen', ' Resumen'],
              ['movimientos', ' Movimientos'],
              ['cerrar', ' Cerrar Caja'],
            ] as const).map(([id, label]) => (
              <button key={id} onClick={() => setTab(id as any)} style={{
                padding: '8px 16px', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
                background: tab === id ? '#2563eb' : 'transparent',
                color: tab === id ? '#fff' : '#64748b',
                transition: 'all .15s',
              }}>{label}</button>
            ))}
          </div>

          {tab === 'resumen' && <CajaResumenPanel data={data} />}
          {tab === 'movimientos' && <CajaMovimientosPanel data={data} loading={loading} onRegistrarMovimiento={handleRegistrarMovimiento} />}
          {tab === 'cerrar' && <CajaCerrarPanel data={data} loading={loading} onCerrarCaja={handleCerrarCaja} cierreResult={cierreResult} onDismissCierreResult={() => setCierreResult(null)} />}
        </>
      )}

      {!data?.activa && cierreResult && (
        <CajaCerrarPanel data={data as any} loading={loading} onCerrarCaja={() => {}} cierreResult={cierreResult} onDismissCierreResult={() => setCierreResult(null)} />
      )}
    </div>
  );
}
