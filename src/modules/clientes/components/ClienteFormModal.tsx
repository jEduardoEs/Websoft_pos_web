import React from 'react';

interface ClienteFormModalProps {
  form: any;
  setForm: any;
  onSave: () => void;
  onClose: () => void;
  loading: boolean;
}

export function ClienteFormModal({ form, setForm, onSave, onClose, loading }: ClienteFormModalProps) {
  const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: '#8a887e', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div className="card" style={{ width: 600, padding: 30, background: '#fff', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#18181b', marginBottom: 20 }}>
          {form.id ? 'Editar Cliente' : 'Nuevo Cliente'}
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div style={{ gridColumn: '1 / -1' }}><label style={lbl}>Nombre completo / Razón social *</label><input className="input" autoFocus value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Juan Perez" /></div>
          <div><label style={lbl}>NIT / Documento</label><input className="input" value={form.nit} onChange={e => setForm({ ...form, nit: e.target.value })} placeholder="Ej: 123456-7" /></div>
          <div><label style={lbl}>Teléfono / WhatsApp</label><input className="input" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} placeholder="Ej: 55554444" /></div>
          <div style={{ gridColumn: '1 / -1' }}><label style={lbl}>Email</label><input className="input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Ej: juan@mail.com" /></div>
          <div style={{ gridColumn: '1 / -1' }}><label style={lbl}>Dirección</label><input className="input" value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} placeholder="Ej: Ciudad" /></div>
          <div style={{ gridColumn: '1 / -1' }}><label style={lbl}>Notas / Observaciones</label><textarea className="input" rows={3} value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} placeholder="Detalles adicionales del cliente..." /></div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn-secondary" onClick={onClose} disabled={loading}>Cancelar</button>
          <button className="btn-primary" onClick={onSave} disabled={loading}>
            {loading ? 'Guardando...' : form.id ? 'Guardar Cambios' : 'Crear Cliente'}
          </button>
        </div>
      </div>
    </div>
  );
}
