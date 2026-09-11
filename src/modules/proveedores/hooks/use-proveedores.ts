import { useState, useCallback } from 'react';
import { Proveedor } from '../types/proveedor';
import { CreateProveedorDto } from '../dto/create-proveedor.dto';
import { UpdateProveedorDto } from '../dto/update-proveedor.dto';

export function useProveedores() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProveedores = useCallback(async (buscar: string = '') => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/proveedores?buscar=${encodeURIComponent(buscar)}`);
      if (!res.ok) throw new Error('Error al cargar proveedores');
      setProveedores(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createProveedor = async (data: CreateProveedorDto) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/proveedores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const d = await res.json();
      if (!res.ok || !d.ok) throw new Error(d.error || 'Error al crear');
      await fetchProveedores();
      return d.proveedor;
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const updateProveedor = async (id: number, data: UpdateProveedorDto) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/proveedores', {
        method: 'POST', // The route handles POST for updates too if ID is provided
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data }),
      });
      const d = await res.json();
      if (!res.ok || !d.ok) throw new Error(d.error || 'Error al actualizar');
      await fetchProveedores();
      return d.proveedor;
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const deleteProveedor = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/proveedores?id=${id}`, { method: 'DELETE' });
      const d = await res.json();
      if (!res.ok || !d.ok) throw new Error(d.error || 'Error al eliminar');
      await fetchProveedores();
      return d;
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return {
    proveedores,
    loading,
    error,
    fetchProveedores,
    createProveedor,
    updateProveedor,
    deleteProveedor,
  };
}
