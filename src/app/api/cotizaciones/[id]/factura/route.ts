import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const cotId = parseInt(params.id);
    const cotizacion = await prisma.cotizacion.findUnique({
      where: { id: cotId },
    });

    if (!cotizacion) {
      return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 });
    }

    // Look up sales invoice linked to this quotation
    const venta = await prisma.venta.findFirst({
      where: {
        OR: [
          { notas: { contains: `[Cotización COT-${cotId}]` } },
          { notas: { contains: `cotización ${cotizacion.numero}` } },
        ],
      },
      orderBy: { id: 'desc' },
      include: {
        items: true,
      },
    });

    if (!venta) {
      return NextResponse.json({ error: 'No se encontró una factura emitida para esta cotización' }, { status: 404 });
    }

    return NextResponse.json(venta);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error interno' }, { status: 500 });
  }
}
