import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { configuracionService } from '../services/configuracion.service';

export function useConfiguracion() {
  const [cfg, setCfg] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [asignando, setAsignando] = useState(false);
  const [resultadoAsignacion, setResultadoAsignacion] = useState<any>(null);

  const fetchConfig = async () => {
    try {
      const data = await configuracionService.getConfiguracion();
      setCfg(data);
    } catch (err: any) {
      toast.error(err.message || 'Error al cargar configuración');
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const setConfigValue = (key: string, value: string) => {
    setCfg((prev) => ({ ...prev, [key]: value }));
  };

  const saveConfiguracion = async (keys?: string[]) => {
    setLoading(true);
    try {
      const toSave = keys ? Object.fromEntries(keys.map(k => [k, cfg[k]])) : cfg;
      await configuracionService.saveConfiguracion(toSave);
      toast.success('Configuración guardada');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const asignarCodigos = async (soloSinCodigo: boolean) => {
    if (!confirm(soloSinCodigo
      ? '¿Asignar códigos automáticos solo a productos sin código?'
      : '¿Reasignar códigos a TODOS los productos? Esto sobreescribirá códigos existentes.'))
      return;
    
    setAsignando(true);
    setResultadoAsignacion(null);
    try {
      const result = await configuracionService.asignarCodigos(soloSinCodigo);
      setResultadoAsignacion(result);
      toast.success(result.mensaje);
    } catch (err: any) {
      toast.error(err.message || 'Error al asignar códigos');
    } finally {
      setAsignando(false);
    }
  };

  return {
    cfg,
    loading,
    saved,
    asignando,
    resultadoAsignacion,
    setConfigValue,
    saveConfiguracion,
    asignarCodigos,
    refresh: fetchConfig
  };
}
