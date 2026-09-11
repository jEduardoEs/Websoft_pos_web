import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export interface FelVenta {
  id: number;
  numero: string;
  fecha: string;
  clienteNombre: string;
  clienteNit: string;
  total: number;
  felUuid?: string;
  felSerie?: string;
  felNumero?: number;
  felCertificacion?: string;
  felEstado?: string;
}

export function useFel() {
  const [tab, setTab] = useState<'estado' | 'historial' | 'guia'>('estado');
  const [ventas, setVentas] = useState<FelVenta[]>([]);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<Record<string, string>>({});
  
  const [fi, setFi] = useState(new Date().toISOString().slice(0, 10));
  const [ff, setFf] = useState(new Date().toISOString().slice(0, 10));
  
  const [dteviaKey, setDteviaKey] = useState('');
  const [savingKey, setSavingKey] = useState(false);

  const loadConfig = useCallback(async () => {
    const res = await fetch('/api/config');
    const data = await res.json();
    setConfig(data);
  }, []);

  const loadVentasFel = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ fecha_ini: fi, fecha_fin: ff });
      const res = await fetch(`/api/ventas?${p}`);
      const data = await res.json();
      setVentas(Array.isArray(data) ? data.filter((v: FelVenta) => v.felUuid || v.felEstado) : []);
    } catch (err) {
      toast.error('Error al cargar historial DTE');
    } finally {
      setLoading(false);
    }
  }, [fi, ff]);

  const guardarDteviaKey = async () => {
    if (!dteviaKey.startsWith('qapi_')) {
      toast.error('La key debe empezar con qapi_test_ o qapi_live_');
      return;
    }
    setSavingKey(true);
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dtevia_api_key: dteviaKey, fel_certificador: 'dtevia' }),
      });
      const d = await res.json();
      if (d.ok !== false) {
        toast.success('API key de DTEvia guardada');
        setDteviaKey('');
        loadConfig();
      } else {
        toast.error(d.error || 'Error al guardar');
      }
    } catch (err) {
      toast.error('Error de conexión');
    } finally {
      setSavingKey(false);
    }
  };

  const toggleFel = async () => {
    const nuevo = config.fel_activo === 'true' ? 'false' : 'true';
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fel_activo: nuevo }),
      });
      const data = await res.json();
      if (data.ok !== false) {
        toast.success(nuevo === 'true' ? 'FEL activado — las ventas emitirán DTE' : 'FEL desactivado');
        loadConfig();
      }
    } catch (err) {
      toast.error('Error al cambiar configuración');
    }
  };

  return {
    state: { tab, ventas, loading, config, fi, ff, dteviaKey, savingKey },
    setters: { setTab, setFi, setFf, setDteviaKey },
    actions: { loadConfig, loadVentasFel, guardarDteviaKey, toggleFel }
  };
}
