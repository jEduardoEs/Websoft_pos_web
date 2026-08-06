import { prisma } from '@/lib/prisma';

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export class MantenimientoService {
  static async findAll() {
    const hoy = new Date();
    const en15dias = new Date();
    en15dias.setDate(hoy.getDate() + 15);

    const todos = await prisma.mantenimiento.findMany({ orderBy: { createdAt: 'desc' } });

    const proximos = todos.filter((m: any) => {
      const fechas = [
        !m.mant1Realizado && m.mant1Fecha,
        !m.mant2Realizado && m.mant2Fecha,
        !m.mant3Realizado && m.mant3Fecha,
      ].filter(Boolean) as Date[];
      return fechas.some((f: Date) => new Date(f) <= en15dias && new Date(f) >= hoy);
    });

    const vencidos = todos.filter((m: any) => {
      const fechas = [
        !m.mant1Realizado && m.mant1Fecha,
        !m.mant2Realizado && m.mant2Fecha,
        !m.mant3Realizado && m.mant3Fecha,
      ].filter(Boolean) as Date[];
      return fechas.some((f: Date) => new Date(f) < hoy);
    });

    return { todos, proximos, vencidos };
  }

  static async create(data: {
    clienteNombre: string;
    clienteTelefono?: string;
    clienteDireccion?: string;
    descripcion: string;
    fechaInstalacion: string | Date;
    notas?: string;
    ventaNumero?: string;
  }) {
    if (!data.clienteNombre || !data.descripcion || !data.fechaInstalacion) {
      throw new Error('Datos incompletos');
    }

    const fechaInst = new Date(data.fechaInstalacion);
    const count = await prisma.mantenimiento.count();
    const numero = `MAN-${String(count + 1).padStart(6, '0')}`;

    const m = await prisma.mantenimiento.create({
      data: {
        numero,
        clienteNombre: data.clienteNombre,
        clienteTelefono: data.clienteTelefono,
        clienteDireccion: data.clienteDireccion,
        descripcion: data.descripcion,
        fechaInstalacion: fechaInst,
        mant1Fecha: addMonths(fechaInst, 4),
        mant2Fecha: addMonths(fechaInst, 8),
        mant3Fecha: addMonths(fechaInst, 12),
        notas: data.notas,
        ventaNumero: data.ventaNumero,
      },
    });

    return m;
  }

  static async updateStatus(id: number, mantIndex: number, notas?: string) {
    const data: any = {};
    if (mantIndex === 1) { data.mant1Realizado = true; data.mant1Notas = notas; }
    if (mantIndex === 2) { data.mant2Realizado = true; data.mant2Notas = notas; }
    if (mantIndex === 3) { data.mant3Realizado = true; data.mant3Notas = notas; }

    const m = await prisma.mantenimiento.findUnique({ where: { id } });
    if (!m) throw new Error('No encontrado');

    const updated = await prisma.mantenimiento.update({ where: { id }, data });
    return updated;
  }
}
