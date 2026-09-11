import React from 'react';
import { fmt, fmtDate } from '@/lib/utils';
import { calculateIVA } from '@/shared/money';

interface CotizacionPreviewModalProps {
  selected: any;
  onClose: () => void;
  onImprimir: (cot: any) => void;
  onSolicitarCambioEstado: (id: number, estado: string, numero: string) => void;
  onEliminar: (id: number) => void;
  onAbrirSendModal: (cot: any) => void;
}

export function CotizacionPreviewModal({
  selected,
  onClose,
  onImprimir,
  onSolicitarCambioEstado,
  onEliminar,
  onAbrirSendModal,
}: CotizacionPreviewModalProps) {
  if (!selected) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: '100%', maxWidth: 780, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{selected.numero}</h2>
              <span className={`badge badge-${selected.estado}`}>{selected.estado}</span>
            </div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{fmtDate(selected.fecha)} · {selected.clienteNombre}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-ghost btn-sm" onClick={() => onImprimir(selected)}> Imprimir / PDF</button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#94a3b8' }}>&times;</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, background: '#f8fafc', padding: 14, borderRadius: 10, marginBottom: 20, fontSize: 12 }}>
          <div>
            <div style={{ color: '#64748b', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Cliente</div>
            <div style={{ fontWeight: 700, color: '#0f172a' }}>{selected.clienteNombre}</div>
            {selected.clienteNit && <div style={{ color: '#475569' }}>NIT: {selected.clienteNit}</div>}
            {selected.clienteTelefono && <div style={{ color: '#475569' }}>Tel: {selected.clienteTelefono}</div>}
            {selected.clienteDireccion && <div style={{ color: '#475569' }}>{selected.clienteDireccion}</div>}
          </div>
          <div>
            <div style={{ color: '#64748b', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Detalles</div>
            <div>Atención: <strong>{selected.atencion || '—'}</strong></div>
            <div>Forma de pago: {selected.formaPago || '—'}</div>
            <div>Validez: {selected.validezDias} días</div>
          </div>
        </div>

        {selected.descripcion && (
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: 12, marginBottom: 20, fontSize: 13, color: '#1e40af' }}>
            {selected.descripcion}
          </div>
        )}

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
          <thead>
            <tr>
              {['Codigo', 'Descripcion', 'Cant.', 'P/Unit.', 'Desc.', 'Total'].map(h => (
                <th key={h} style={{ background: '#f8fafc', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {selected.items.map((it: any, i: number) => (
              <tr key={i}>
                <td style={{ padding: '9px 12px', fontSize: 11, fontFamily: 'monospace', color: '#2563eb', fontWeight: 700, borderBottom: '1px solid #f1f5f9' }}>{it.codigo || ''}</td>
                <td style={{ padding: '9px 12px', fontSize: 12, borderBottom: '1px solid #f1f5f9', color: '#0f172a' }}>{it.descripcion}</td>
                <td style={{ padding: '9px 12px', fontSize: 12, textAlign: 'center', borderBottom: '1px solid #f1f5f9' }}>{it.cantidad}</td>
                <td style={{ padding: '9px 12px', fontSize: 12, borderBottom: '1px solid #f1f5f9', color: '#475569' }}>{fmt(it.precioUnitario)}</td>
                <td style={{ padding: '9px 12px', fontSize: 12, borderBottom: '1px solid #f1f5f9', color: it.descuento > 0 ? '#dc2626' : '#94a3b8' }}>{it.descuento > 0 ? fmt(it.descuento) : '—'}</td>
                <td style={{ padding: '9px 12px', fontSize: 13, fontWeight: 700, borderBottom: '1px solid #f1f5f9', color: '#0f172a' }}>{fmt(it.totalItem)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
          <div style={{ background: '#f8fafc', border: '1.5px solid #bfdbfe', borderRadius: 10, padding: '12px 18px', minWidth: 240 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#475569', marginBottom: 4 }}><span>Subtotal</span><span>{fmt(selected.subtotal || selected.total)}</span></div>
            {selected.descuento > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#dc2626', marginBottom: 4 }}><span>Descuento</span><span>-{fmt(selected.descuento)}</span></div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#d97706', fontWeight: 600, marginBottom: 8 }}><span>IVA (5% Incluido)</span><span>{fmt(calculateIVA(selected.total, 0.05))}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 800, color: '#2563eb', borderTop: '2px solid #bfdbfe', paddingTop: 8 }}><span>TOTAL</span><span>{fmt(selected.total)}</span></div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {selected.estado === 'pendiente' && (
                <>
                  <button onClick={() => onSolicitarCambioEstado(selected.id, 'aceptada', selected.numero)}
                    style={{ padding: '6px 14px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                     Aceptar
                  </button>
                  <button onClick={() => onSolicitarCambioEstado(selected.id, 'rechazada', selected.numero)}
                    style={{ padding: '6px 14px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                     Rechazar
                  </button>
                </>
              )}
              {selected.estado !== 'pendiente' && (
                <button onClick={() => onSolicitarCambioEstado(selected.id, 'pendiente', selected.numero)}
                  style={{ padding: '6px 14px', background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  ↩ Reabrir
                </button>
              )}
              <button onClick={() => onSolicitarCambioEstado(selected.id, 'vencida', selected.numero)}
                style={{ padding: '6px 14px', background: '#f8fafc', color: '#94a3b8', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                Marcar vencida
              </button>
            </div>
            <button className="btn-danger btn-sm" onClick={() => onEliminar(selected.id)}>Eliminar</button>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-ghost" onClick={onClose}>Cerrar</button>
            <button className="btn-primary" onClick={() => onAbrirSendModal(selected)}>Enviar / Descargar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
