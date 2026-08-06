import React from 'react';
import { MODULOS } from '@/lib/permisos';

interface UsuarioFormModalProps {
  form: any;
  setForm: any;
  roles: any[];
  showPermisos: boolean;
  setShowPermisos: (s: boolean) => void;
  onSave: () => void;
  onClose: () => void;
  loading: boolean;
  GROUPS: string[];
}

export function UsuarioFormModal({
  form, setForm, roles, showPermisos, setShowPermisos, onSave, onClose, loading, GROUPS
}: UsuarioFormModalProps) {
  const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 };

  const applyRol = (rolId: string) => {
    const rolDef = roles.find(r => r.id === rolId);
    const perms = (rolDef?.permisos?.length ? rolDef.permisos : []);
    setForm((p: any) => ({ ...p, rol: rolId, permisos: perms }));
  };

  const togglePermiso = (modulo: string) => {
    setForm((prev: any) => ({
      ...prev,
      permisos: prev.permisos.includes(modulo) ? prev.permisos.filter((p: string) => p !== modulo) : [...prev.permisos, modulo],
    }));
  };

  const rolDef = roles.find(r => r.id === form.rol);
  const rolColor = rolDef?.color || '#64748b';

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div className="card" style={{ width: 800, padding: 30, maxHeight: '90vh', overflowY: 'auto', background: '#fff', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 24 }}>
          {form.id ? 'Editar Usuario' : 'Nuevo Usuario'}
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
          <div><label style={lbl}>Nombre completo</label><input className="input" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Juan Perez" /></div>
          <div><label style={lbl}>Usuario (login)</label><input className="input" value={form.usuario} onChange={e => setForm({ ...form, usuario: e.target.value.toLowerCase().replace(/\s/g,'') })} placeholder="Ej: juanp" disabled={!!form.id} /></div>
          <div>
            <label style={lbl}>{form.id ? 'Cambiar Contraseña' : 'Contraseña'}</label>
            <input className="input" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder={form.id ? 'Deja en blanco para no cambiar' : 'Requerida para nuevo usuario'} />
          </div>
          <div>
            <label style={lbl}>Rol base</label>
            <select className="input" value={form.rol} onChange={e => applyRol(e.target.value)} style={{ fontWeight: 600 }}>
              {roles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Meta Mensual de Ventas (Opcional)</label>
            <input className="input" type="number" step="0.01" min="0" value={form.metaMensual} onChange={e => setForm({ ...form, metaMensual: e.target.value })} placeholder="Ej: 50000" />
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Para calcular su % de avance en reportes.</div>
          </div>
        </div>

        {form.rol !== 'admin' && (
          <div style={{ marginBottom: 24, padding: '16px 20px', borderRadius: 12, border: `1px solid ${rolColor}30`, background: `${rolColor}05` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>Permisos del Rol: <span style={{ color: rolColor }}>{rolDef?.nombre}</span></div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Este usuario tiene acceso a {form.permisos.length} módulos del sistema.</div>
              </div>
              <button onClick={() => setShowPermisos(!showPermisos)} style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#0f172a' }}>
                {showPermisos ? 'Ocultar permisos' : 'Ver y editar permisos'}
              </button>
            </div>

            {showPermisos && (
              <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 12, color: '#d97706', background: '#fef3c7', padding: '8px 12px', borderRadius: 6, marginBottom: 16 }}>
                  ️ <b>Nota:</b> Al modificar estos permisos individualmente, este usuario tendrá reglas personalizadas diferentes al rol base seleccionado.
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                  {GROUPS.map(group => (
                    <div key={group} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: 10 }}>{group}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {MODULOS.filter(m => m.group === group).map(m => (
                          <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: form.permisos.includes(m.id) ? '#0f172a' : '#94a3b8' }}>
                            <input type="checkbox" checked={form.permisos.includes(m.id)} onChange={() => togglePermiso(m.id)} />
                            <span>{m.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 10 }}>
          <button className="btn-secondary" onClick={onClose} disabled={loading}>Cancelar</button>
          <button className="btn-primary" onClick={onSave} disabled={loading}>
            {loading ? 'Guardando...' : form.id ? 'Guardar Cambios' : 'Crear Usuario'}
          </button>
        </div>
      </div>
    </div>
  );
}
