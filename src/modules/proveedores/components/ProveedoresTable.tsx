import React from 'react';
import { Proveedor } from '../types/proveedor';
import { Mail, Phone, MessageCircle } from 'lucide-react';

interface ProveedoresTableProps {
  proveedores: Proveedor[];
  onEdit: (p: Proveedor) => void;
  onDelete: (p: Proveedor) => void;
  onWhatsApp: (tel: string) => void;
}

export function ProveedoresTable({ proveedores, onEdit, onDelete, onWhatsApp }: ProveedoresTableProps) {
  const thS: React.CSSProperties = { background: '#f8fafc', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', padding: '10px 16px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' };
  
  return (
    <div className="card" style={{ flex: 1, overflowY: 'auto', padding: 0 }}>
      <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
            <th style={thS}>Nombre</th>
            <th style={thS}>NIT</th>
            <th style={thS}>Contacto</th>
            <th style={thS}>Teléfono</th>
            <th style={thS}>Email</th>
            <th style={thS}>Registro</th>
            <th style={{ ...thS, textAlign: 'right' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {proveedores.length === 0 ? (
            <tr>
              <td colSpan={7} style={{ textAlign: 'center', padding: 48, color: '#8a887e', fontSize: 13 }}>
                Sin proveedores registrados
              </td>
            </tr>
          ) : (
            proveedores.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid #e2e8f0', transition: 'background-color .15s' }}>
                <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0f172a' }}>{p.nombre}</td>
                <td style={{ padding: '12px 16px', color: '#64748b' }}>{p.nit || '-'}</td>
                <td style={{ padding: '12px 16px', color: '#64748b' }}>{p.contacto || '-'}</td>
                <td style={{ padding: '12px 16px', color: '#64748b' }}>
                  {p.telefono ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>{p.telefono}</span>
                      <button onClick={() => onWhatsApp(p.telefono!)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#16a34a', display: 'flex' }} title="Mensaje por WhatsApp">
                        <MessageCircle size={15} />
                      </button>
                      <a href={`tel:${p.telefono}`} style={{ color: '#2563eb', display: 'flex' }} title="Llamar">
                        <Phone size={15} />
                      </a>
                    </div>
                  ) : '-'}
                </td>
                <td style={{ padding: '12px 16px', color: '#64748b' }}>
                  {p.email ? (
                    <a href={`https://mail.google.com/mail/?view=cm&fs=1&to=${p.email}`} target="_blank" rel="noreferrer" style={{ color: '#2563eb', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }} title="Enviar correo vía Gmail">
                      <Mail size={15} />
                      {p.email}
                    </a>
                  ) : '-'}
                </td>
                <td style={{ padding: '12px 16px', color: '#64748b', fontSize: 12 }}>
                  {p.creadoEn ? new Date(p.creadoEn).toLocaleDateString() : '-'}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <button onClick={() => onEdit(p)} className="btn-ghost btn-sm" style={{ padding: '4px 10px', fontSize: 11 }}>Editar</button>
                    <button onClick={() => onDelete(p)} className="btn-ghost btn-sm" style={{ padding: '4px 10px', fontSize: 11, color: '#dc2626', borderColor: '#fecaca', background: '#fef2f2' }}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      </div>
    </div>
  );
}
