import { prisma } from '@/lib/prisma';

export class ZonasBackendService {
  static async getZonas(soloActivas: boolean) {
    return prisma.zonaInstalacion.findMany({
      where: soloActivas ? { activa: true } : {},
      orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
    });
  }

  static async crearZona(data: any) {
    const { nombre, departamento, tarifa, notas } = data;
    if (!nombre || !departamento) throw new Error('Nombre y departamento son requeridos');

    const maxOrden = await prisma.zonaInstalacion.aggregate({ _max: { orden: true } });
    
    return prisma.zonaInstalacion.create({
      data: {
        nombre,
        departamento,
        tarifa: +tarifa || 0,
        notas: notas || null,
        orden: (maxOrden._max.orden || 0) + 1,
      },
    });
  }

  static async actualizarZona(id: number, data: any) {
    const updateData: any = {};
    if (data.nombre !== undefined) updateData.nombre = data.nombre;
    if (data.departamento !== undefined) updateData.departamento = data.departamento;
    if (data.tarifa !== undefined) updateData.tarifa = +data.tarifa || 0;
    if (data.notas !== undefined) updateData.notas = data.notas;
    if (data.activa !== undefined) updateData.activa = !!data.activa;
    if (data.orden !== undefined) updateData.orden = +data.orden;

    return prisma.zonaInstalacion.update({
      where: { id },
      data: updateData,
    });
  }

  static async eliminarZona(id: number) {
    return prisma.zonaInstalacion.delete({ where: { id } });
  }
}
