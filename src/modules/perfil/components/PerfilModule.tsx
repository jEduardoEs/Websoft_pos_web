"use client";
import React, { useState, useEffect } from 'react';
import { usePerfil } from '../hooks/use-perfil';
import { fmt } from '@/lib/utils';

export function PerfilModule() {
  const { perfil, loading, saving, updatePerfil } = usePerfil();

  const [nombre, setNombre] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Sincronizar datos iniciales
  useEffect(() => {
    if (perfil) {
      setNombre(perfil.nombre || '');
    }
  }, [perfil]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (password) {
      if (password !== confirmPassword) {
        setErrorMsg('Las contraseñas no coinciden');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('La contraseña debe tener al menos 6 caracteres');
        return;
      }
    }

    const ok = await updatePerfil(nombre, password);
    if (ok) {
      setPassword('');
      setConfirmPassword('');
    }
  };

  if (loading && !perfil) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500 font-medium">Cargando perfil...</div>
      </div>
    );
  }

  if (!perfil) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500 font-medium">No se pudo cargar el perfil</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      
      {/* Header Info */}
      <div className="card" style={{ padding: '30px', display: 'flex', alignItems: 'center', gap: '24px', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
        <div style={{ width: 80, height: 80, background: '#1e293b', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 800, color: '#fff', flexShrink: 0, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
          {perfil.nombre.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>{perfil.nombre}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>@{perfil.usuario}</span>
            <span style={{ fontSize: '11px', background: '#3b82f6', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontWeight: 700, textTransform: 'uppercase' }}>
              {perfil.rol}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Formulario de Actualización */}
        <div className="md:col-span-2 card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
            Actualizar Información
          </h3>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {errorMsg && (
              <div style={{ padding: '12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '13px', fontWeight: 600 }}>
                {errorMsg}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Nombre Completo</label>
              <input 
                type="text" 
                value={nombre} 
                onChange={e => setNombre(e.target.value)}
                className="input"
                placeholder="Tu nombre completo"
                required
              />
            </div>

            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>Cambiar Contraseña</h4>
              <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>Deja estos campos en blanco si no deseas cambiar tu contraseña actual.</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Nueva Contraseña</label>
                  <input 
                    type="password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)}
                    className="input"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Confirmar Contraseña</label>
                  <input 
                    type="password" 
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="input"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button 
                type="submit" 
                className="btn-primary" 
                disabled={saving || !nombre}
                style={{ minWidth: '150px' }}
              >
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>

        {/* Resumen o Metas */}
        <div className="md:col-span-1 space-y-6">
          <div className="card" style={{ padding: '24px', background: '#fff' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '16px' }}>
              Meta Mensual
            </h3>
            
            {perfil.metaMensual > 0 ? (
              <div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#16a34a', marginBottom: '4px' }}>
                  {fmt(perfil.metaMensual)}
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>Esta es la meta asignada para ti este mes.</div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>🎯</div>
                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>No tienes una meta de ventas asignada.</div>
              </div>
            )}
          </div>
          
          <div className="card" style={{ padding: '24px', background: '#f8fafc' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '12px' }}>Información de la Cuenta</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: '#64748b' }}>ID de Usuario</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{perfil.id}</span>
              </li>
              <li style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: '#64748b' }}>Rol</span>
                <span style={{ fontWeight: 600, color: '#0f172a', textTransform: 'capitalize' }}>{perfil.rol}</span>
              </li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}
