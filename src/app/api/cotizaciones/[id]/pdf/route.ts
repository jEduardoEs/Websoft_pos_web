import { NextRequest, NextResponse } from 'next/server';
import { CotizacionService } from '@/modules/cotizaciones/services/cotizacion.service';
import { ConfigBackendService } from '@/modules/configuracion/services/config.backend.service';

export const dynamic = 'force-dynamic';

async function fetchWithRetry<T>(fn: () => Promise<T>, retries = 3, delay = 800): Promise<T> {
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (i < retries - 1) {
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const cot = await fetchWithRetry(() => CotizacionService.findById(Number(params.id)));
    if (!cot) {
      return new NextResponse('Cotización no encontrada', { status: 404 });
    }

    const { d: configData } = await fetchWithRetry(() => ConfigBackendService.getCuentasPdfData()).catch(() => ({ d: {} as any }));

    const totalNum = Number(cot.total) || 0;
    const subtotalBase = totalNum / 1.05;
    const ivaMonto = totalNum - subtotalBase;

    const rows = (cot.items || []).map((it: any) => `
      <tr>
        <td style="padding:8px 10px;font-size:11px;color:#2563eb;font-weight:600;border-bottom:1px solid #e2e8f0;vertical-align:top">${it.codigo || '—'}</td>
        <td style="padding:8px 10px;font-size:11px;color:#0f172a;border-bottom:1px solid #e2e8f0;vertical-align:top">
          <div style="font-weight:600">${it.descripcion}</div>
        </td>
        <td style="padding:8px 10px;font-size:11px;text-align:center;color:#0f172a;border-bottom:1px solid #e2e8f0;vertical-align:top">${it.cantidad}</td>
        <td style="padding:8px 10px;font-size:11px;text-align:right;color:#0f172a;border-bottom:1px solid #e2e8f0;vertical-align:top">Q ${Number(it.precioUnitario).toFixed(2)}</td>
        <td style="padding:8px 10px;font-size:11px;font-weight:700;text-align:right;color:#0f172a;border-bottom:1px solid #e2e8f0;vertical-align:top">Q ${Number(it.totalItem).toFixed(2)}</td>
      </tr>
    `).join('');

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Cotización ${cot.numero} — ${configData.empresa_nombre || 'WebSoft Solutions'}</title>
  <style>
    @page { size: auto; margin: 8mm; }
    @media print {
      @page { margin: 8mm; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 11px; color: #0f172a; background: #fff; padding: 16px; }
    .container { max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2.5px solid #1e293b; padding-bottom: 14px; margin-bottom: 16px; }
    .company-title { font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }
    .company-title span { color: #2563eb; }
    .company-sub { font-size: 10px; color: #64748b; margin-top: 3px; }
    .doc-type { font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px; text-align: right; }
    .doc-number { font-size: 22px; font-weight: 900; color: #2563eb; font-family: 'Courier New', monospace; text-align: right; }
    .doc-date { font-size: 10px; color: #64748b; text-align: right; margin-top: 2px; }
    
    .client-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; display: grid; grid-template-columns: 2fr 1fr; gap: 12px; }
    .client-label { font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 3px; }
    .client-val { font-size: 13px; font-weight: 700; color: #0f172a; }
    .client-detail { font-size: 11px; color: #334155; margin-top: 2px; }

    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th { background: #0f172a; color: #fff; font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 8px 10px; text-align: left; }
    
    .totals-box { margin-left: auto; width: 340px; margin-bottom: 20px; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 8px; padding: 12px 16px; }
    .totals-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 11px; color: #475569; }
    .totals-row.grand { border-top: 2px solid #0f172a; padding-top: 8px; margin-top: 4px; font-size: 16px; font-weight: 800; color: #2563eb; }

    .terms-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 20px; font-size: 10px; color: #334155; }
    .notes-box { background: #eff6ff; border: 1.5px solid #bfdbfe; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; font-size: 11px; color: #1e3a8a; line-height: 1.4; }
    .notes-title { font-weight: 700; font-size: 10px; text-transform: uppercase; letter-spacing: .5px; color: #1e40af; margin-bottom: 4px; }
    
    .sign-row { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 36px; padding: 0 30px; }
    .sign-line { border-top: 1px solid #0f172a; text-align: center; padding-top: 4px; font-size: 10px; font-weight: 700; color: #334155; }
    .footer { margin-top: 24px; text-align: center; font-size: 9px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <!-- HEADER -->
    <div class="header">
      <div>
        <div class="company-title">${configData.empresa_nombre || 'WebSoft Solutions'}</div>
        <div class="company-sub">NIT: ${configData.empresa_nit || '115471413'} · ${configData.empresa_direccion || 'Guastatoya, El Progreso'}</div>
        <div class="company-sub">Teléfono / WhatsApp: ${configData.empresa_telefono || '3836-1044'}</div>
      </div>
      <div>
        <div class="doc-type">Cotización Comercial</div>
        <div class="doc-number">${cot.numero}</div>
        <div class="doc-date">Fecha: ${new Date(cot.createdAt).toLocaleDateString('es-GT', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
      </div>
    </div>

    <!-- CLIENTE -->
    <div class="client-box">
      <div>
        <div class="client-label">Cliente / Razón Social</div>
        <div class="client-val">${cot.clienteNombre}</div>
        <div class="client-detail">NIT: ${cot.clienteNit || 'CF'}${cot.clienteTelefono ? ` · Tel: ${cot.clienteTelefono}` : ''}</div>
        ${cot.clienteDireccion ? `<div class="client-detail">Dirección: ${cot.clienteDireccion}</div>` : ''}
      </div>
      <div>
        ${cot.atencion ? `<div><div class="client-label">Atención A</div><div class="client-detail" style="font-weight:600">${cot.atencion}</div></div>` : ''}
        <div style="margin-top:6px"><div class="client-label">Validez</div><div class="client-detail">${cot.validezDias || 15} Días Hábiles</div></div>
      </div>
    </div>

    ${cot.descripcion ? `<div style="margin-bottom:12px;font-size:11px;color:#334155"><strong>Asunto / Descripción General:</strong> ${cot.descripcion}</div>` : ''}

    <!-- TABLA DE ITEMS -->
    <table>
      <thead>
        <tr>
          <th style="width:12%">Código</th>
          <th>Descripción del Producto / Servicio</th>
          <th style="text-align:center;width:10%">Cant.</th>
          <th style="text-align:right;width:15%">Precio U.</th>
          <th style="text-align:right;width:15%">Total</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>

    <!-- TOTALES -->
    <div class="totals-box">
      <div class="totals-row">
        <span>Base Imponible (Subtotal sin IVA):</span>
        <span>Q ${subtotalBase.toFixed(2)}</span>
      </div>
      <div class="totals-row" style="color:#2563eb">
        <span>IVA Incluido (5%):</span>
        <span>Q ${ivaMonto.toFixed(2)}</span>
      </div>
      ${cot.descuento > 0 ? `
        <div class="totals-row" style="color:#dc2626">
          <span>Descuento Aplicado:</span>
          <span>-Q ${Number(cot.descuento).toFixed(2)}</span>
        </div>
      ` : ''}
      <div class="totals-row grand">
        <span>TOTAL FINAL COTIZADO:</span>
        <span>Q ${totalNum.toFixed(2)}</span>
      </div>
      <div style="font-size:9px;color:#1e40af;text-align:center;margin-top:8px;font-weight:700;background:#eff6ff;padding:6px 8px;border-radius:6px;border:1px solid #bfdbfe;line-height:1.3">
        ACLARACIÓN FISCAL: Todos los precios expresados en este documento incluyen el Impuesto al Valor Agregado (IVA - 5% Pequeño Contribuyente). Factura Electrónica FEL emitida al confirmar la compra.
      </div>
    </div>

    <!-- CONDICIONES Y FORMA DE PAGO -->
    <div class="terms-grid">
      <div>
        <strong>Formas de Pago Aceptadas:</strong><br/>
        ${cot.formaPago || 'Efectivo, Transferencia Bancaria, Depósito, Cheque Preautorizado'}
      </div>
      <div>
        <strong>Tiempo de Entrega / Instalación:</strong><br/>
        ${cot.tiempoInstalacion || 'Según disponibilidad de agenda / 3 a 5 días hábiles'}
      </div>
    </div>

    <!-- ANOTACIONES Y ACLARACIONES PARA EL CLIENTE -->
    ${cot.notas ? `
      <div class="notes-box">
        <div class="notes-title">Anotaciones / Aclaraciones Importantes para el Cliente:</div>
        <div>${cot.notas.replace(/\n/g, '<br/>')}</div>
      </div>
    ` : ''}

    <!-- FIRMAS -->
    <div class="sign-row">
      <div class="sign-line">Atentamente,<br/>WebSoft Solutions</div>
      <div class="sign-line">Aceptado por el Cliente<br/>Firma / Sello</div>
    </div>

    <div class="footer">
      ${configData.empresa_nombre || 'WebSoft Solutions'} · Sistema POS · Documento de Cotización ${cot.numero}
    </div>
  </div>

  <script>
    window.onload = function() {
      document.title = 'Cotización ${cot.numero} — ${cot.clienteNombre}';
      window.focus();
      setTimeout(function() {
        window.print();
      }, 300);
    }
  </script>
</body>
</html>`;

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (e: any) {
    return new NextResponse(`Error al generar PDF: ${e.message || 'Error interno'}`, { status: 500 });
  }
}
