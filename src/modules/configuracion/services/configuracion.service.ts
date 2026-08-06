export class ConfiguracionService {
  async getConfiguracion(): Promise<Record<string, string>> {
    const res = await fetch('/api/config');
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Error al cargar configuración');
    }
    return res.json();
  }

  async saveConfiguracion(data: Record<string, string>): Promise<any> {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!result.ok) {
      throw new Error(result.error || 'Error al guardar configuración');
    }
    return result;
  }

  async asignarCodigos(soloSinCodigo: boolean): Promise<any> {
    const res = await fetch('/api/productos/asignar-codigos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ soloSinCodigo }),
    });
    const result = await res.json();
    if (!result.ok) {
      throw new Error(result.error || 'Error al asignar códigos');
    }
    return result;
  }
}

export const configuracionService = new ConfiguracionService();
