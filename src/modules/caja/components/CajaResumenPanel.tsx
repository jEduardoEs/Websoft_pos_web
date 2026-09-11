import React from 'react';
import { CajaResumen } from '../types/caja';
import { fmt } from '@/lib/utils';

interface CajaResumenPanelProps {
  data: CajaResumen;
}

export function CajaResumenPanel({ data }: CajaResumenPanelProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        {[
          { label: 'Num. ventas', value: String(data.numVentas), color: '#2563eb', sub: 'En este turno' },
          { label: 'Total ventas', value: fmt(data.totalVentas), color: '#16a34a', sub: 'Todos los metodos' },
          { label: 'Efectivo en caja', value: fmt(data.debeHaber), color: '#0f172a', sub: 'Debe haber' },
          { label: 'Retiros a bodega', value: fmt(data.totalRetiros), color: '#d97706', sub: 'Enviado fuera' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '14px 18px' }}>
            <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {/* Ventas por metodo */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 14 }}>Ventas por metodo de pago</div>
          {[
            { label: 'Efectivo', value: data.ventasEfectivo, color: '#16a34a', badge: 'badge-green' },
            { label: 'Tarjeta', value: data.ventasTarjeta, color: '#2563eb', badge: 'badge-blue' },
            { label: 'Transferencia', value: data.ventasTransferencia, color: '#8b5cf6', badge: 'badge-gray' },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid #f1f5f9' }}>
              <span className={r.badge}>{r.label}</span>
              <span style={{ fontWeight: 700, color: r.color, fontSize: 15 }}>{fmt(r.value)}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', fontWeight: 800, fontSize: 16, color: '#0f172a' }}>
            <span>TOTAL</span><span style={{ color: '#2563eb' }}>{fmt(data.totalVentas)}</span>
          </div>
        </div>

        {/* Formula efectivo */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 14 }}>Efectivo esperado en caja</div>
          {[
            { label: 'Fondo inicial', value: data.activa?.fondoInicial || 0, prefix: '' },
            { label: '+ Ventas efectivo', value: data.ventasEfectivo, prefix: '+' },
            { label: '+ Inyecciones', value: data.totalInyecciones, prefix: '+' },
            { label: '- Retiros a bodega', value: data.totalRetiros, prefix: '-', red: true },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
              <span style={{ color: '#475569' }}>{r.label}</span>
              <span style={{ color: r.red ? '#dc2626' : '#0f172a' }}>{fmt(r.value)}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0', fontWeight: 800, fontSize: 17, borderTop: '2px solid #e2e8f0', marginTop: 4 }}>
            <span>DEBE HABER EN CAJA</span>
            <span style={{ color: '#2563eb' }}>{fmt(data.debeHaber)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
