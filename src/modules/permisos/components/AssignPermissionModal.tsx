// src/modules/permisos/components/AssignPermissionModal.tsx
import React from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
}

export const AssignPermissionModal: React.FC<Props> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }} onClick={onClose}>
      <div style={{ background: '#fff', padding: '20px', borderRadius: '8px' }} onClick={e => e.stopPropagation()}>
        {children}
        <button onClick={onClose} style={{ marginTop: '10px' }}>Cerrar</button>
      </div>
    </div>
  );
};
