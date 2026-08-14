import { CreateProyectoDto } from '../dto/create-proyecto.dto';
import { ProyectoRepository } from '../repositories/proyecto.repository';

export class ProyectoService {
  private static repository = new ProyectoRepository();

  static async findAll(params: { estado?: string; buscar?: string }) {
    return this.repository.findAll(params);
  }

  static async findById(id: number) {
    return this.repository.findById(id);
  }

  static async create(data: CreateProyectoDto, userId: number, userName: string) {
    return this.repository.create(data, userId, userName);
  }

  static async update(id: number, data: Partial<CreateProyectoDto> & { pin?: string }, userId: number, userName: string) {
    return this.repository.update(id, data, userId, userName);
  }

  static async updateEstado(id: number, estado: string) {
    const proyecto = await this.repository.findById(id);
    if (!proyecto) throw new Error('Proyecto no encontrado');
    return this.repository.update(id, { estado }, proyecto.usuarioId || 1, 'System');
  }

  static async facturarProyecto(id: number, data: any, userId: number, userName: string) {
    return this.repository.facturarProyecto(id, data, userId, userName);
  }

  static async facturarFEL(id: number, opciones?: { emisorNit?: string; emisorNombre?: string; correoCliente?: string; enviarCorreo?: boolean }) {
    return this.repository.facturarProyecto(id, opciones || {}, 1, 'System');
  }

  static async registerMantenimiento(id: number, mantId: number, data: any, userId: number, userName: string) {
    return this.repository.registerMantenimiento(id, mantId, data, userId, userName);
  }

  static async delete(id: number, role: string, pin?: string) {
    return this.repository.delete(id, role, pin);
  }

  static async createFromSale(saleId: number) {
    const { prisma } = await import('@/lib/prisma');
    const venta = await prisma.venta.findUnique({
      where: { id: saleId },
      include: { items: true },
    });
    if (!venta) throw new Error('Venta no encontrada');

    const dto: CreateProyectoDto = {
      nombre: `Proyecto Venta ${venta.numero}`,
      clienteNombre: venta.clienteNombre,
      clienteNit: venta.clienteNit,
      descripcion: `Proyecto generado automáticamente a partir de la venta ${venta.numero}`,
      cotizacionId: venta.cotizacionId ? String(venta.cotizacionId) : undefined,
    };

    const proyecto = await this.create(dto, 1, 'System');
    
    const { eventBus } = require('@/core/events/EventBus');
    await eventBus.publish({
      type: 'ProjectCreated',
      payload: { projectId: proyecto.id, saleId: venta.id },
      timestamp: new Date(),
    });

    return proyecto;
  }

  static async markReadyForExecution(saleId: number) {
    console.info(`[ProyectoService] markReadyForExecution called for sale ${saleId}`);
    return true;
  }

  static async handleInvoicing(projectId: number) {
    const result = await this.repository.handleInvoicing(projectId);
    const { eventBus } = require('@/core/events/EventBus');
    await eventBus.publish({
      type: 'ProjectInvoiced',
      payload: { projectId, saleId: undefined },
      timestamp: new Date(),
    });
    return result;
  }
}
