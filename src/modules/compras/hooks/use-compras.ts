import { useState, useCallback } from 'react';
import { Compra } from '../types/compra';
import { CreateCompraDto } from '../dto/create-compra.dto';

export function useCompras() {
  const [compras, setCompras] = useState<Compra[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCompras = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/compras');
      if (!res.ok) throw new Error('Error al cargar compras');
      setCompras(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createCompra = async (data: CreateCompraDto) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/compras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const d = await res.json();
      if (!res.ok || !d.ok) throw new Error(d.error || 'Error al crear compra');
      await fetchCompras();
      return d.compra;
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const uploadFactura = async (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/upload/factura', { method: 'POST', body: fd });
    const data = await res.json();
    if (data.ok) {
      return data.url;
    }
    throw new Error(data.error || 'Error al subir factura');
  };

  return {
    compras,
    loading,
    error,
    fetchCompras,
    createCompra,
    uploadFactura,
  };
}
