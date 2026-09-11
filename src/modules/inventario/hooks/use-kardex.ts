// src/modules/inventario/hooks/use-kardex.ts

import { useState } from 'react';
import { Kardex } from '../types/kardex';
import { AjusteStockDto } from '../dto/ajuste-stock.dto';
import { toast } from 'sonner';

export function useKardex() {
  const [kardex, setKardex] = useState<Kardex[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchKardex = async (productoId: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/kardex?producto_id=${productoId}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al cargar kardex');
      }
      const data = await res.json();
      setKardex(data);
    } catch (e: any) {
      setError(e.message);
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const aplicarAjuste = async (dto: AjusteStockDto) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/kardex', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al aplicar ajuste');
      }
      const data = await res.json();
      toast.success('Ajuste aplicado correctamente');
      
      // Reload kardex
      await fetchKardex(dto.productoId);
      
      return data;
    } catch (e: any) {
      setError(e.message);
      toast.error(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { kardex, loading, error, fetchKardex, aplicarAjuste };
}
