import React from 'react';

interface CotizacionSendModalProps {
  sendModal: any;
  sendEmail: string;
  sendLoading: boolean;
  onEmailChange: (val: string) => void;
  onSendEmail: (cot: any) => void;
  onDownloadPDF: (id: number) => void;
  onClose: () => void;
}

export function CotizacionSendModal({
  sendModal,
  sendEmail,
  sendLoading,
  onEmailChange,
  onSendEmail,
  onDownloadPDF,
  onClose,
}: CotizacionSendModalProps) {
  if (!sendModal) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 14, padding: 24, width: '100%', maxWidth: 440 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>Enviar / Descargar Cotizacion</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>&times;</button>
        </div>
        <p style={{ fontSize: 12, color: '#64748b', marginBottom: 14 }}>
          Cotización <strong>{sendModal.numero}</strong> para <strong>{sendModal.clienteNombre}</strong>
        </p>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Correo del cliente</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="input" type="email" value={sendEmail} onChange={e => onEmailChange(e.target.value)} placeholder="cliente@correo.com" style={{ fontSize: 12 }} />
            <button className="btn-primary btn-sm" onClick={() => onSendEmail(sendModal)} disabled={sendLoading}>
              {sendLoading ? 'Enviando...' : 'Enviar Email'}
            </button>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 14, marginTop: 14 }}>
          <button className="btn-ghost btn-sm" style={{ width: '100%' }} onClick={() => onDownloadPDF(sendModal.id)}>
             Descargar PDF Profesional (API)
          </button>
        </div>

        <div style={{ marginTop: 12, textAlign: 'right' }}>
          <button className="btn-ghost btn-sm" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}
