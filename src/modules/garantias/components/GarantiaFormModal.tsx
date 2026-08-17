import React from 'react';

interface GarantiaFormModalProps {
  showModal: boolean;
  form: any;
  ventas: any[];
  loading: boolean;
  onClose: () => void;
  onSelVenta: (id: string) => void;
  onSetField: (key: string, value: any) => void;
  onSave: () => void;
}

export function GarantiaFormModal({
  showModal,
  form,
  ventas,
  loading,
  onClose,
  onSelVenta,
  onSetField,
  onSave,
}: GarantiaFormModalProps) {
  if (!showModal) return null;

  const lbl = { display: 'block' as const, fontSize: 11, fontWeight: 700 as const, color: '#8a887e', textTransform: 'uppercase' as const, marginBottom: 4 };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 20, overflowY: 'auto' }}>
      <div style={{ background: '#fff', border: '1.5px solid #d8d6cd', borderRadius: 6, padding: 28, width: '100%', maxWidth: 680, margin: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 14, borderBottom: '1.5px solid #d8d6cd' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#18181b' }}>Nueva Garantía</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#8a887e' }}>×</button>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={lbl}>Vincular a factura de venta (opcional)</label>
          <select className="input" onChange={e => onSelVenta(e.target.value)}>
            <option value="">Seleccionar venta...</option>
            {ventas.slice(0, 50).map((v: any) => <option key={v.id} value={v.id}>{v.numero} — {v.clienteNombre}</option>)}
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {[
            { label: 'Nombre cliente *', key: 'clienteNombre', full: true },
            { label: 'NIT', key: 'clienteNit' }, { label: 'Teléfono', key: 'clienteTelefono' },
            { label: 'Producto *', key: 'productoNombre', full: true },
            { label: 'No. Serie', key: 'productoSerie' }, { label: 'No. Factura', key: 'ventaNumero' },
            { label: 'Fecha de venta', key: 'fechaVenta', type: 'date' },
            { label: 'Días de garantía', key: 'diasGarantia', type: 'number' },
            { label: 'Condiciones', key: 'condiciones', full: true },
          ].map((f: any) => (
            <div key={f.key} style={{ gridColumn: f.full ? '1/-1' : 'auto' }}>
              <label style={lbl}>{f.label}</label>
              <input className="input" type={f.type || 'text'} value={(form as any)[f.key]} onChange={e => onSetField(f.key, e.target.value)} />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={onSave} disabled={loading}>{loading ? 'Guardando...' : 'Crear e Imprimir'}</button>
        </div>
      </div>
    </div>
  );
}
