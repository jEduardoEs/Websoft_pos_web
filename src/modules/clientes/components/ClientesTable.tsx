import React from 'react';
import { Cliente } from '../types/cliente';

interface ClientesTableProps {
  clientes: Cliente[];
  onEdit: (c: Cliente) => void;
  onDelete: (c: Cliente) => void;
  onWhatsApp: (tel: string) => void;
}

export function ClientesTable({ clientes, onEdit, onDelete, onWhatsApp }: ClientesTableProps) {
  const thS: React.CSSProperties = { background: '#f8fafc', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', padding: '10px 16px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' };
  
  return (
    <div className="card" style={{ flex: 1, overflowY: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={thS}>Nombre</th>
            <th style={thS}>NIT</th>
            <th style={thS}>Teléfono</th>
            <th style={thS}>Email</th>
            <th style={thS}>Notas</th>
            <th style={thS}>Registro</th>
            <th style={thS}></th>
          </tr>
        </thead>
        <tbody>
          {clientes.map(c => (
            <tr key={c.id}>
              <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', fontWeight: 600, color: '#0f172a' }}>{c.nombre}</td>
              <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', color: '#64748b' }}>{c.nit || '-'}</td>
              <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', color: '#64748b' }}>
                {c.telefono ? (
                  <span onClick={() => onWhatsApp(c.telefono!)} style={{ cursor: 'pointer', color: '#16a34a', textDecoration: 'underline' }}>{c.telefono}</span>
                ) : '-'}
              </td>
              <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', color: '#64748b' }}>{c.email || '-'}</td>
              <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', color: '#64748b', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.notas || '-'}</td>
              <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', color: '#64748b', fontSize: 12 }}>
                {c.creadoEn ? new Date(c.creadoEn).toLocaleDateString() : '-'}
              </td>
              <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', textAlign: 'right' }}>
                <button onClick={() => onEdit(c)} className="btn-secondary" style={{ padding: '4px 8px', fontSize: 12, marginRight: 8 }}>Editar</button>
                <button onClick={() => onDelete(c)} className="btn-secondary" style={{ padding: '4px 8px', fontSize: 12, color: '#dc2626' }}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
