// Total Audit Service for WebSoft POS (Phase 6.8 Auditoría Total)
// Golden Rule: NO EMOJIS anywhere in code or comments.

import { prisma } from '@/lib/prisma';

export interface TotalAuditPayload {
  usuarioId?: number;
  usuarioNombre?: string;
  fecha?: Date;
  ip?: string;
  equipo?: string;
  estadoAnterior?: string | null;
  estadoNuevo?: string | null;
  modulo: string;
  accion: string;
  registroId?: string | number;
  valoresModificados?: any;
  detalle?: string;
}

export class TotalAuditService {
  /**
   * Helper to extract request headers (IP & Device User-Agent) from NextRequest or Headers object.
   */
  static extractRequestMetadata(reqHeaders?: any): { ip: string; equipo: string } {
    if (!reqHeaders) {
      return { ip: '127.0.0.1', equipo: 'Server Internal' };
    }

    const getHeader = (key: string): string | null => {
      if (typeof reqHeaders.get === 'function') {
        return reqHeaders.get(key);
      }
      return reqHeaders[key] || reqHeaders[key.toLowerCase()] || null;
    };

    const rawIp = getHeader('x-forwarded-for') || getHeader('x-real-ip') || '127.0.0.1';
    const ip = rawIp.split(',')[0].trim();
    const equipo = getHeader('user-agent') || 'Dispositivo Desconocido';

    return { ip, equipo };
  }

  /**
   * Writes a complete audit log entry capturing User, Date, IP, Device, Old State, New State, Module, Action, and Changed Values.
   */
  static async log(payload: TotalAuditPayload): Promise<void> {
    try {
      const fecha = payload.fecha || new Date();
      const structuredDetail = {
        modulo: payload.modulo,
        equipo: payload.equipo || 'Server Process',
        estadoAnterior: payload.estadoAnterior || null,
        estadoNuevo: payload.estadoNuevo || null,
        valoresModificados: payload.valoresModificados || null,
        notas: payload.detalle || null,
        timestamp: fecha.toISOString(),
      };

      await prisma.auditLog.create({
        data: {
          fecha,
          usuarioId: payload.usuarioId || 1,
          usuarioNombre: payload.usuarioNombre || 'Sistema',
          accion: payload.accion,
          tabla: payload.modulo,
          registroId: payload.registroId ? String(payload.registroId) : undefined,
          ip: payload.ip || '127.0.0.1',
          detalle: JSON.stringify(structuredDetail),
        },
      });
    } catch (error) {
      console.error('[TotalAuditService] Error saving audit log entry:', error);
    }
  }
}
