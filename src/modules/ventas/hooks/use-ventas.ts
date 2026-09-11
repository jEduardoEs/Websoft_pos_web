import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Venta } from '../types/venta';
import { CreateVentaDto } from '../dto/create-venta.dto';

export function useVentas() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVentas = useCallback(async (params?: { fechaIni?: string; fechaFin?: string; estado?: string; buscar?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const p = new URLSearchParams();
      if (params?.fechaIni) p.set('fecha_ini', params.fechaIni);
      if (params?.fechaFin) p.set('fecha_fin', params.fechaFin);
      if (params?.estado) p.set('estado', params.estado);
      if (params?.buscar) p.set('buscar', params.buscar);
      
      const res = await fetch(`/api/ventas?${p.toString()}`);
      if (!res.ok) throw new Error('Error al cargar ventas');
      
      const data = await res.json();
      setVentas(data);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createVenta = async (dto: CreateVentaDto) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ventas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al procesar la venta');
      
      return data; // Returns { ok, venta, fel, email }
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const anularVenta = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/ventas?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al anular la venta');
      
      toast.success('Venta anulada correctamente');
      setVentas(prev => prev.map(v => v.id === id ? { ...v, estado: 'anulada' } : v));
      return data;
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    ventas,
    loading,
    error,
    fetchVentas,
    createVenta,
    anularVenta,
  };
}
