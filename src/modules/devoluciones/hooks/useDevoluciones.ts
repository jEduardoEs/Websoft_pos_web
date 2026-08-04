"use client";
import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { Devolucion } from '../types/devolucion';

export function useDevoluciones() {
  const [devoluciones, setDevoluciones] = useState<Devolucion[]>([]);
  const [loading, setLoading] = useState(false);

  // Modals state
  const [showFormModal, setShowFormModal] = useState(false);
  const [selected, setSelected] = useState<Devolucion | null>(null);
  const [detailModal, setDetailModal] = useState<Devolucion | null>(null);

  const loadDevoluciones = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/devoluciones');
      const data = await res.json();
      setDevoluciones(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error('Error al cargar devoluciones');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDevoluciones();
  }, [loadDevoluciones]);

  const aprobar = async (id: number) => {
    try {
      const res = await fetch('/api/devoluciones', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'aprobar' }),
      });
      if (res.ok) {
        toast.success('Devolución aprobada');
        loadDevoluciones();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Error al aprobar');
      }
    } catch {
      toast.error('Error de conexión');
    }
  };

  const anular = async (id: number) => {
    try {
      const res = await fetch('/api/devoluciones', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'anular' }),
      });
      if (res.ok) {
        toast.success('Devolución anulada');
        loadDevoluciones();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Error al anular');
      }
    } catch {
      toast.error('Error de conexión');
    }
  };

  return {
    state: { devoluciones, loading, showFormModal, selected, detailModal },
    setters: { setShowFormModal, setSelected, setDetailModal },
    actions: { loadDevoluciones, aprobar, anular },
  };
}
