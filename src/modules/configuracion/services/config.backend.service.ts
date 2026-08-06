import { prisma } from '@/lib/prisma';

export class ConfigBackendService {
  // Default config values
  static readonly DEFAULTS: Record<string, string> = {
    // Empresa
    empresa_nombre:       'WebSoft Solutions',
    empresa_nit:          'CF',
    empresa_direccion:    'Barrio el Calvario, Guastatoya, El Progreso',
    empresa_telefono:     '3836-1044 / 3671-4377',
    empresa_email:        '',
    empresa_web:          'websoftsolutions.com.gt',
    // Facturación
    moneda_simbolo:       'Q',
    iva_porcentaje:       '5',
    regimen_fiscal:       'pequeno_contribuyente',
    numero_siguiente:     '1',
    factura_prefijo:      'FAC',
    // Productos
    producto_prefijo:     'WSP',
    producto_siguiente:   '1',
    // Cotizaciones
    cotizacion_prefijo:   'COT',
    numero_siguiente_cotizacion: '1',
    cotizacion_validez:   '15',
    // Tickets
    ticket_mensaje:       '¡Gracias por su compra! Vuelva pronto.',
    ticket_mostrar_logo:  'true',
    // Alertas
    stock_alerta_minimo:  '5',
    // FEL
    fel_activo:           'false',
    fel_certificador:     'pendiente',
    fel_usuario:          '',
    fel_clave:            '',
    fel_nit_emisor:       '',
    fel_nombre_emisor:    'WebSoft Solutions',
    fel_ambiente:         'pruebas', // pruebas | produccion
  };

  static async getConfig() {
    const rows = await prisma.config.findMany();
    const cfg: Record<string, string> = { ...this.DEFAULTS };
    rows.forEach(r => { cfg[r.clave] = r.valor; });
    return cfg;
  }

  static async setConfig(body: Record<string, any>) {
    const ops = Object.entries(body).map(([clave, valor]) =>
      prisma.config.upsert({
        where: { clave },
        update: { valor: String(valor) },
        create: { clave, valor: String(valor) },
      })
    );
    await prisma.$transaction(ops);
  }

  static async getCuentasPdfData() {
    const keys = [
      'empresa_nombre', 'empresa_nit', 'empresa_telefono', 'empresa_web', 'empresa_direccion',
      'banco1_nombre', 'banco1_cuenta', 'banco1_titular',
      'banco2_nombre', 'banco2_cuenta', 'banco2_titular',
      'banco3_nombre', 'banco3_cuenta', 'banco3_titular',
      'banco4_nombre', 'banco4_cuenta', 'banco4_titular',
      'cuentas_nota',
    ];

    const rows = await prisma.config.findMany({ where: { clave: { in: keys } } });
    const cfg: Record<string, string> = {};
    rows.forEach((r: any) => { cfg[r.clave] = r.valor; });

    const d = {
      empresa_nombre:   cfg.empresa_nombre   || 'WebSoft Solutions',
      empresa_nit:      cfg.empresa_nit      || '',
      empresa_telefono: cfg.empresa_telefono || '3836-1044 / 3671-4377',
      empresa_web:      cfg.empresa_web      || 'websoftsolutions.com.gt',
      empresa_direccion:cfg.empresa_direccion|| 'Guastatoya, El Progreso',
      cuentas_nota:     cfg.cuentas_nota     || 'Estas son las únicas cuentas bancarias autorizadas para recibir depósitos y transferencias. No procesamos órdenes si el depósito se realiza a otra cuenta.',
    };

    const bancos = [1, 2, 3, 4].map(i => ({
      nombre:  cfg[`banco${i}_nombre`]  || '',
      cuenta:  cfg[`banco${i}_cuenta`]  || '',
      titular: cfg[`banco${i}_titular`] || '',
    })).filter(b => b.nombre && b.cuenta);

    return { d, bancos };
  }
}
