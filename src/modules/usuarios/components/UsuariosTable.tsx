import React from 'react';
import { Usuario } from '../types/usuario';

interface UsuariosTableProps {
  usuarios: Usuario[];
  roles: any[];
  onEdit: (u: Usuario) => void;
  onDesactivar: (id: number) => void;
  onActivar: (id: number) => void;
  onCerrarSesion: (id: number) => void;
}

export function UsuariosTable({ usuarios, roles, onEdit, onDesactivar, onActivar, onCerrarSesion }: UsuariosTableProps) {
  const thS: React.CSSProperties = { background: '#f8fafc', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', padding: '10px 16px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' };

  return (
    <div className="card" style={{ overflowX: 'auto', flex: 1, height: '100%' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={thS}>Nombre</th>
            <th style={thS}>Usuario</th>
            <th style={thS}>Rol</th>
            <th style={thS}>Estado</th>
            <th style={thS}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map(u => {
            const rDef = roles.find(r => r.id === u.rol);
            const rColor = rDef?.color || '#64748b';
            const rName = rDef?.nombre || u.rol;

            return (
              <tr key={u.id} style={{ opacity: u.activo ? 1 : 0.5 }}>
                <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', fontWeight: 600, color: '#0f172a' }}>{u.nombre}</td>
                <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', color: '#64748b' }}>@{u.usuario}</td>
                <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ background: `${rColor}15`, color: rColor, padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                    {rName}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
                  {u.activo ? <span className="badge-green">Activo</span> : <span className="badge-red">Inactivo</span>}
                </td>
                <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => onEdit(u)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb', fontWeight: 600, fontSize: 13 }}>
                      Editar
                    </button>
                    {u.activo && (
                      <button onClick={() => {
                        if (confirm(`¿Desactivar "${u.nombre}"?`)) onDesactivar(u.id);
                      }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontWeight: 600, fontSize: 13 }}>
                        Desactivar
                      </button>
                    )}
                    {!u.activo && (
                      <button onClick={() => onActivar(u.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#16a34a', fontWeight: 600, fontSize: 13 }}>
                        Reactivar
                      </button>
                    )}
                    {u.activo && (
                      <button onClick={() => {
                        if (confirm(`¿Forzar cierre de sesión de "${u.nombre}"?`)) onCerrarSesion(u.id);
                      }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d97706', fontWeight: 600, fontSize: 13 }} title="Fuerza a este usuario a volver a iniciar sesión">
                        Desloguear
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
