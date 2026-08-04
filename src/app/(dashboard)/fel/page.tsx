'use client';

import React, { useEffect } from 'react';
import { useFel } from '@/modules/fel/hooks/use-fel';
import { FelEstadoTab } from '@/modules/fel/components/FelEstadoTab';
import { FelHistorialTab } from '@/modules/fel/components/FelHistorialTab';
import { FelGuiaTab } from '@/modules/fel/components/FelGuiaTab';

export default function FelPage() {
  const { state, setters, actions } = useFel();
  
  const { tab, ventas, loading, config, fi, ff, dteviaKey, savingKey } = state;
  const { setTab, setFi, setFf, setDteviaKey } = setters;
  const { loadConfig, loadVentasFel, guardarDteviaKey, toggleFel } = actions;

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    if (tab === 'historial') {
      loadVentasFel();
    }
  }, [tab, fi, ff, loadVentasFel]);

  const felActivo = config.fel_activo === 'true';
  const modo = config.fel_ambiente || 'sandbox';

  const tabStyle = (t: string) => ({
    padding: '7px 18px', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13,
    fontWeight: 600, fontFamily: 'inherit',
    background: tab === t ? '#1581E3' : '#f8fafc',
    color: tab === t ? '#fff' : '#64748b',
    transition: 'all .15s',
  });

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 960 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Facturación Electrónica FEL</h1>
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>Integración FEL · SAT Guatemala · Configuración y Emisión</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ background: felActivo ? '#f0fdf4' : '#fffbeb', border: `1px solid ${felActivo ? '#bbf7d0' : '#fde68a'}`, borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 700, color: felActivo ? '#166534' : '#92400e' }}>
            FEL: {felActivo ? 'Activo' : 'Inactivo'}
          </div>
          {felActivo && (
            <div style={{ background: modo === 'produccion' ? '#f0fdf4' : '#eff6ff', border: `1px solid ${modo === 'produccion' ? '#bbf7d0' : '#bfdbfe'}`, borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 700, color: modo === 'produccion' ? '#166534' : '#1e40af' }}>
              {modo === 'produccion' ? 'Producción' : modo === 'pruebas' ? 'Pruebas INFILE' : 'Sandbox Local'}
            </div>
          )}
        </div>
      </div>

      {/* Tabs Menu */}
      <div style={{ display: 'flex', gap: 6 }}>
        <button style={tabStyle('estado')} onClick={() => setTab('estado')}>Estado y Configuración</button>
        <button style={tabStyle('historial')} onClick={() => setTab('historial')}>Historial DTE</button>
        <button style={tabStyle('guia')} onClick={() => setTab('guia')}>Guía de Activación</button>
      </div>

      {/* Tab Content */}
      {tab === 'estado' && (
        <FelEstadoTab 
          config={config} 
          dteviaKey={dteviaKey} 
          setDteviaKey={setDteviaKey}
          savingKey={savingKey}
          guardarDteviaKey={guardarDteviaKey}
          toggleFel={toggleFel}
        />
      )}

      {tab === 'historial' && (
        <FelHistorialTab 
          fi={fi}
          setFi={setFi}
          ff={ff}
          setFf={setFf}
          loading={loading}
          loadVentasFel={loadVentasFel}
          ventas={ventas}
        />
      )}

      {tab === 'guia' && (
        <FelGuiaTab />
      )}
    </div>
  );
}
