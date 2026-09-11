// src/modules/permisos/components/PermissionForm.tsx
import React from 'react';
import { CreatePermissionDto } from '@/modules/permisos/dto/create-permission.dto';

interface Props {
  onSubmit: (data: CreatePermissionDto) => void;
  initialData?: Partial<CreatePermissionDto>;
}

export const PermissionForm: React.FC<Props> = ({ onSubmit, initialData }) => {
  const [name, setName] = React.useState(initialData?.name || '');
  const [description, setDescription] = React.useState(initialData?.description || '');
  const [scope, setScope] = React.useState<'GLOBAL' | 'MODULE' | 'ENTITY'>(initialData?.scope || 'GLOBAL');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, description, scope });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <input placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} required />
      <input placeholder="Descripción" value={description} onChange={(e) => setDescription(e.target.value)} />
      <select value={scope} onChange={(e) => setScope(e.target.value as any)}>
        <option value="GLOBAL">GLOBAL</option>
        <option value="MODULE">MODULE</option>
        <option value="ENTITY">ENTITY</option>
      </select>
      <button type="submit">Guardar</button>
    </form>
  );
};
