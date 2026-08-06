"use client";
import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

export interface PerfilData {
  id: number;
  nombre: string;
  usuario: string;
  rol: string;
  metaMensual: number;
}

export function usePerfil() {
  const [perfil, setPerfil] = useState<PerfilData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadPerfil = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/perfil');
      const data = await res.json();
      if (res.ok) {
        setPerfil(data);
      } else {
        toast.error(data.error || 'Error al cargar perfil');
      }
    } catch (err) {
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPerfil();
  }, [loadPerfil]);

  const updatePerfil = async (nombre: string, password?: string) => {
    setSaving(true);
    try {
      const res = await fetch('/api/perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, password }),
      });
      const data = await res.json();
      
      if (res.ok && data.ok) {
        toast.success('Perfil actualizado correctamente');
        setPerfil(data.perfil);
        return true;
      } else {
        toast.error(data.error || 'Error al actualizar perfil');
        return false;
      }
    } catch (err) {
      toast.error('Error de conexión');
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    perfil,
    loading,
    saving,
    updatePerfil,
    loadPerfil,
  };
}
