import { useState, useCallback } from 'react';
import { Cliente } from '../types/cliente';
import { CreateClienteDto } from '../dto/create-cliente.dto';
import { UpdateClienteDto } from '../dto/update-cliente.dto';

export function useClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClientes = useCallback(async (buscar: string = '') => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/clientes?buscar=${encodeURIComponent(buscar)}`);
      if (!res.ok) throw new Error('Error al cargar clientes');
      setClientes(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createCliente = async (data: CreateClienteDto) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const d = await res.json();
      if (!res.ok || !d.ok) throw new Error(d.error || 'Error al crear');
      await fetchClientes();
      return d.cliente;
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const updateCliente = async (id: number, data: UpdateClienteDto) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/clientes', {
        method: 'POST', // The route handles POST for updates too if ID is provided
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data }),
      });
      const d = await res.json();
      if (!res.ok || !d.ok) throw new Error(d.error || 'Error al actualizar');
      await fetchClientes();
      return d.cliente;
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const deleteCliente = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/clientes?id=${id}`, { method: 'DELETE' });
      const d = await res.json();
      if (!res.ok || !d.ok) throw new Error(d.error || 'Error al eliminar');
      await fetchClientes();
      return d;
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return {
    clientes,
    loading,
    error,
    fetchClientes,
    createCliente,
    updateCliente,
    deleteCliente,
  };
}
