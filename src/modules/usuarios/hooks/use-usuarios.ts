import { useState, useCallback } from 'react';
import { Usuario } from '../types/usuario';
import { CreateUsuarioDto } from '../dto/create-usuario.dto';
import { UpdateUsuarioDto } from '../dto/update-usuario.dto';

export function useUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/usuarios');
      if (!res.ok) throw new Error('Error al cargar usuarios');
      setUsuarios(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createUsuario = async (data: CreateUsuarioDto) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const d = await res.json();
      if (!res.ok || !d.ok) throw new Error(d.error || 'Error al crear');
      await fetchUsuarios();
      return d;
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const updateUsuario = async (id: number, data: UpdateUsuarioDto) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/usuarios', {
        method: 'POST', // The route handles POST for updates too if ID is provided
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data }),
      });
      const d = await res.json();
      if (!res.ok || !d.ok) throw new Error(d.error || 'Error al actualizar');
      await fetchUsuarios();
      return d;
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const deleteUsuario = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/usuarios?id=${id}`, { method: 'DELETE' });
      const d = await res.json();
      if (!res.ok || !d.ok) throw new Error(d.error || 'Error al eliminar');
      await fetchUsuarios();
      return d;
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const activarUsuario = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/usuarios', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, accion: 'activar' }),
      });
      const d = await res.json();
      if (!res.ok || !d.ok) throw new Error(d.error || 'Error al activar');
      await fetchUsuarios();
      return d;
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const cerrarSesion = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/usuarios', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, accion: 'cerrar_sesion' }),
      });
      const d = await res.json();
      if (!res.ok || !d.ok) throw new Error(d.error || 'Error al cerrar sesion');
      await fetchUsuarios();
      return d;
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return {
    usuarios,
    loading,
    error,
    fetchUsuarios,
    createUsuario,
    updateUsuario,
    deleteUsuario,
    activarUsuario,
    cerrarSesion
  };
}
