// src/modules/permisos/components/PermissionTable.tsx
import React from 'react';
import { Permission } from '@/modules/permisos/types/permission.types';

interface Props {
  permissions: Permission[];
}

export const PermissionTable: React.FC<Props> = ({ permissions }) => {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={{ border: '1px solid #ddd', padding: '8px' }}>ID</th>
          <th style={{ border: '1px solid #ddd', padding: '8px' }}>Nombre</th>
          <th style={{ border: '1px solid #ddd', padding: '8px' }}>Descripción</th>
          <th style={{ border: '1px solid #ddd', padding: '8px' }}>Ámbito</th>
        </tr>
      </thead>
      <tbody>
        {permissions.map((p) => (
          <tr key={p.id}>
            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{p.id}</td>
            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{p.name}</td>
            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{p.description}</td>
            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{p.scope}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
