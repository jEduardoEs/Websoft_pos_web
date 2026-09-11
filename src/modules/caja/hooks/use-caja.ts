import { useState, useCallback } from 'react';
import { CajaResumen } from '../types/caja';
import { AbrirCajaDto, MovimientoCajaDto, CerrarCajaDto } from '../dto/caja.dto';

export function useCaja() {
  const [data, setData] = useState<CajaResumen | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCaja = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/caja');
      if (!res.ok) throw new Error('Error al cargar la caja');
      setData(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const abrirCaja = async (dto: AbrirCajaDto) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/caja', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'abrir', fondo: dto.fondoInicial, notas: dto.notas }),
      });
      const d = await res.json();
      if (!res.ok || !d.ok) throw new Error(d.error || 'Error al abrir caja');
      await fetchCaja();
      return d;
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const registrarMovimiento = async (dto: MovimientoCajaDto) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/caja', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: dto.tipo, monto: dto.monto, motivo: dto.motivo }),
      });
      const d = await res.json();
      if (!res.ok || !d.ok) throw new Error(d.error || 'Error al registrar movimiento');
      await fetchCaja();
      return d;
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const cerrarCaja = async (dto: CerrarCajaDto) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/caja', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'cerrar', ...dto }),
      });
      const d = await res.json();
      if (!res.ok || !d.ok) throw new Error(d.error || 'Error al cerrar caja');
      await fetchCaja();
      return d;
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    error,
    fetchCaja,
    abrirCaja,
    registrarMovimiento,
    cerrarCaja
  };
}
