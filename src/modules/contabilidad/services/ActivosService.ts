import { prisma } from '@/lib/prisma';
import { ActivoFijoDTO, ActivoFijoSchema } from '../types/contabilidad';

export class ActivosService {
  
  static async getActivos() {
    const activos = await prisma.activoFijo.findMany({ orderBy: { createdAt: 'desc' } });
    const resumen = { 
      total: activos.length, 
      valorBruto: activos.reduce((s, a) => s + a.costoOriginal, 0), 
      depreciacionAcum: activos.reduce((s, a) => s + a.depreciacionAcum, 0), 
      valorNeto: activos.reduce((s, a) => s + a.valorNeto, 0), 
      depreciacionMensual: activos.filter(a => a.estado === 'activo').reduce((s, a) => s + a.depreciacionMensual, 0) 
    };
    return { activos, resumen };
  }

  static async createActivo(data: ActivoFijoDTO) {
    const valid = ActivoFijoSchema.parse(data);
    
    const count = await prisma.activoFijo.count();
    const codigo = valid.codigo || `AF-${String(count + 1).padStart(4, '0')}`;
    const costo = valid.costoOriginal;
    const residual = valid.valorResidual || 0;
    const anios = valid.vidaUtilAnios;
    
    const depMensual = (costo - residual) / (anios * 12);
    
    return prisma.activoFijo.create({
      data: { 
        codigo, 
        nombre: valid.nombre, 
        descripcion: valid.descripcion, 
        fechaAdquisicion: new Date(valid.fechaAdquisicion), 
        costoOriginal: costo, 
        vidaUtilAnios: anios, 
        valorResidual: residual, 
        depreciacionMensual: depMensual, 
        valorNeto: costo 
      }
    });
  }
}
