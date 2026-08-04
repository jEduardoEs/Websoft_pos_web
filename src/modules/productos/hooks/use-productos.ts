// src/modules/productos/hooks/use-productos.ts

import { useState } from 'react';
import { Producto } from '../types/producto';

export function useProductos() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProductos = async (filters?: { buscar?: string; categoria?: string }) => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (filters?.buscar) p.set('buscar', filters.buscar);
      if (filters?.categoria) p.set('categoria', filters.categoria);
      
      const res = await fetch(`/api/productos?${p.toString()}`);
      if (!res.ok) throw new Error('Error fetching');
      const data = await res.json();
      setProductos(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return { productos, fetchProductos, loading, error, mutate: setProductos };
}

export function useCreateProducto() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createProducto = async (data: any) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/productos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al crear producto');
      }
      return await res.json();
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { createProducto, loading, error };
}

export function useUpdateProducto() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProducto = async (id: number, data: any) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/productos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al actualizar producto');
      }
      return await res.json();
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { updateProducto, loading, error };
}

export function useDeleteProducto() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteProducto = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/productos?id=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al eliminar producto');
      }
      return await res.json();
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { deleteProducto, loading, error };
}
