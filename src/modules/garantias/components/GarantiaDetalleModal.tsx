import React from 'react';
type Garantia = any;
import { fmtDate, diasRestantes } from '../utils/garantia-calc.helper';

interface GarantiaDetalleModalProps {
  garantia: Garantia;
  reclamos: any[];
  isAdmin: boolean;
  onClose: () => void;
  onAbrirReclamo: () => void;
  onPrintCertificado: () => void;
  onAnular: () => void;
  onEliminar: () => void;
}

const estadoBadge: Record<string, string> = {
  vigente: 'badge-green',
  proxima: 'badge-orange',
  vencida: 'badge-red',
  anulada: 'badge-gray',
};

export function GarantiaDetalleModal({
  garantia,
  reclamos,
  isAdmin,
  onClose,
  onAbrirReclamo,
  onPrintCertificado,
  onAnular,
  onEliminar,
}: GarantiaDetalleModalProps) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, overflowY: 'auto' }}>
      <div style={{ background: '#fff', border: '1.5px solid #d8d6cd', borderRadius: 8, padding: 28, width: '100%', maxWidth: 680, margin: 'auto', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 14, borderBottom: '1.5px solid #d8d6cd' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#18181b', margin: 0 }}>Garantía {garantia.numero}</h3>
              <span className={estadoBadge[garantia.estado] || 'badge-gray'} style={{ textTransform: 'capitalize' }}>
                {garantia.estado}
              </span>
            </div>
            <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>Detalles de la garantía y registro de cobertura</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#94a3b8' }}>&times;</button>
        </div>

        {/* Datos de la garantía */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#1581E3', textTransform: 'uppercase', marginBottom: 8 }}>Datos del Cliente</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{garantia.clienteNombre}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>NIT: {garantia.clienteNit || 'CF'}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Teléfono: {garantia.clienteTelefono || '—'}</div>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#1581E3', textTransform: 'uppercase', marginBottom: 8 }}>Producto / Equipo</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{garantia.productoNombre}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>
              No. Serie: <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#2563eb' }}>{garantia.productoSerie || '—'}</span>
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
              Factura / Venta: <span style={{ fontWeight: 600, color: '#0f172a' }}>{garantia.ventaNumero || '—'}</span>
            </div>
          </div>
        </div>

        {/* Cobertura y Fechas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16, background: '#fafafa', border: '1px solid #e5e5e5', borderRadius: 6, padding: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#8a887e', textTransform: 'uppercase' }}>Fecha Venta / Emisión</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#18181b', marginTop: 4 }}>{fmtDate(garantia.fechaVenta)}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#8a887e', textTransform: 'uppercase' }}>Vencimiento</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#16a34a', marginTop: 4 }}>{fmtDate(garantia.fechaVencimiento)}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#8a887e', textTransform: 'uppercase' }}>Días Cobertura</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>{garantia.diasGarantia} días ({diasRestantes(garantia)} d restantes)</div>
          </div>
        </div>

        {/* Condiciones */}
        {garantia.condiciones && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: 12, marginBottom: 16, fontSize: 12, color: '#166534' }}>
            <div style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: 10, marginBottom: 4 }}>Condiciones de Cobertura</div>
            <div>{garantia.condiciones}</div>
          </div>
        )}

        {/* Notas */}
        {(garantia as any).notas && (
          <div style={{ marginBottom: 16, fontSize: 12, color: '#475569' }}>
            <div style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: 10, color: '#8a887e', marginBottom: 4 }}>Notas Registradas</div>
            <div style={{ background: '#f8fafc', padding: 10, borderRadius: 6, border: '1px solid #e2e8f0' }}>{(garantia as any).notas}</div>
          </div>
        )}

        {/* Historial de Reclamos */}
        {reclamos && reclamos.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#18181b', marginBottom: 8, textTransform: 'uppercase' }}>Historial de Reclamos ({reclamos.length})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {reclamos.map(r => (
                <div key={r.id} style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: 10, fontSize: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#dc2626', marginBottom: 4 }}>
                    <span>{r.numero} · {r.motivoReclamo}</span>
                    <span>{fmtDate(r.fecha)}</span>
                  </div>
                  <div style={{ color: '#475569' }}>{r.descripcionFalla}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Acciones */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20, paddingTop: 14, borderTop: '1px solid #e3e1d8' }}>
          {garantia.estado === 'vigente' && (
            <button
              onClick={onAbrirReclamo}
              style={{ fontSize: 12, fontWeight: 700, padding: '8px 16px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Registrar Reclamo
            </button>
          )}
          <button
            className="btn-ghost"
            onClick={onPrintCertificado}
            style={{ fontSize: 12, fontWeight: 600, padding: '8px 16px' }}
          >
            Imprimir Certificado
          </button>
          {isAdmin && garantia.estado !== 'anulada' && (
            <button
              onClick={onAnular}
              style={{ fontSize: 12, fontWeight: 700, padding: '8px 16px', background: '#fff7ed', color: '#c2410c', border: '1px solid #ffedd5', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Anular
            </button>
          )}
          {isAdmin && (
            <button
              onClick={onEliminar}
              style={{ fontSize: 12, fontWeight: 700, padding: '8px 16px', background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Eliminar
            </button>
          )}
          
          <button className="btn-secondary" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}
