import { prisma } from '@/lib/prisma';
import { ActivoFijoDTO, ActivoFijoSchema } from '../types/contabilidad';

export class ActivosService {
  
  static async getActivos() {
  const activosDB = await prisma.activoFijo.findMany({
    orderBy: { createdAt: 'desc' }
  });

  const hoy = new Date();

  const activos = activosDB.map((a) => {
    const fechaAdquisicion = new Date(a.fechaAdquisicion);

    // Meses transcurridos desde la adquisición
    let mesesTranscurridos =
      (hoy.getFullYear() - fechaAdquisicion.getFullYear()) * 12 +
      (hoy.getMonth() - fechaAdquisicion.getMonth());

    // Si todavía no llegó el día equivalente del mes,
    // ese mes aún no se considera completo.
    if (hoy.getDate() < fechaAdquisicion.getDate()) {
      mesesTranscurridos--;
    }

    mesesTranscurridos = Math.max(0, mesesTranscurridos);

    const totalMesesVidaUtil = a.vidaUtilAnios * 12;

    // Nunca depreciar más meses que la vida útil
    const mesesDepreciables = Math.min(
      mesesTranscurridos,
      totalMesesVidaUtil
    );

    const baseDepreciable =
      a.costoOriginal - a.valorResidual;

    const depreciacionMensual =
      totalMesesVidaUtil > 0
        ? baseDepreciable / totalMesesVidaUtil
        : 0;

    const depreciacionAcum = Math.min(
      depreciacionMensual * mesesDepreciables,
      baseDepreciable
    );

    const valorNeto = Math.max(
      a.costoOriginal - depreciacionAcum,
      a.valorResidual
    );

    return {
      ...a,
      depreciacionMensual,
      depreciacionAcum,
      valorNeto
    };
  });

  const resumen = {
    total: activos.length,

    valorBruto: activos.reduce(
      (s, a) => s + a.costoOriginal,
      0
    ),

    depreciacionAcum: activos.reduce(
      (s, a) => s + a.depreciacionAcum,
      0
    ),

    valorNeto: activos.reduce(
      (s, a) => s + a.valorNeto,
      0
    ),

    depreciacionMensual: activos
      .filter((a) => a.estado === 'activo')
      .reduce(
        (s, a) => s + a.depreciacionMensual,
        0
      )
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
