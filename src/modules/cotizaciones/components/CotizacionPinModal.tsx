import React from 'react';

interface CotizacionPinModalProps {
  pinModal: { id: number; estado: string; numero: string } | null;
  pin: string;
  pinError: string;
  onPinChange: (val: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export function CotizacionPinModal({
  pinModal,
  pin,
  pinError,
  onPinChange,
  onConfirm,
  onClose,
}: CotizacionPinModalProps) {
  if (!pinModal) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: 380, boxShadow: '0 20px 60px rgba(0,0,0,.25)' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ width: 56, height: 56, background: '#fef3c7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 26 }}></div>
          <div style={{ fontWeight: 800, fontSize: 17, color: '#0f172a', marginBottom: 6 }}>Autorizacion requerida</div>
          <div style={{ fontSize: 13, color: '#64748b' }}>
            {'Para '}<strong style={{ color: pinModal.estado === 'aceptada' ? '#16a34a' : '#dc2626' }}>{pinModal.estado === 'aceptada' ? 'ACEPTAR' : 'RECHAZAR'}</strong>{' la cotizacion '}<strong>{pinModal.numero}</strong>{' se requiere el PIN del administrador.'}
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>PIN de Administrador</label>
          <input
            className="input"
            type="password"
            value={pin}
            onChange={e => onPinChange(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && pin && onConfirm()}
            placeholder="Ingresa el PIN"
            autoFocus
            style={{ fontSize: 20, textAlign: 'center', letterSpacing: 6, fontWeight: 700 }}
          />
          {pinError && <div style={{ fontSize: 12, color: '#dc2626', fontWeight: 600, marginTop: 6 }}> {pinError}</div>}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancelar</button>
          <button className="btn-primary" style={{ flex: 1 }} onClick={onConfirm} disabled={!pin}>Confirmar</button>
        </div>
      </div>
    </div>
  );
}
