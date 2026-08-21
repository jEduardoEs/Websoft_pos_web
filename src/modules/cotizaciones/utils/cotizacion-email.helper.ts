import { prisma } from '@/lib/prisma';

export async function enviarCotizacionPorCorreo(cotizacionId: number, email: string) {
  const cot = await prisma.cotizacion.findUnique({
    where: { id: cotizacionId },
    include: { items: true },
  });
  if (!cot) throw new Error('Cotización no encontrada');

  let apiKey = process.env.RESEND_API_KEY;
  let from = process.env.EMAIL_FROM || 'WebSoft Solutions <facturacion@websoftsolutions.com.gt>';
  let emisorNombre = process.env.EMISOR_NOMBRE || 'WebSoft Solutions';
  let emisorNit = process.env.EMISOR_NIT || 'CF';
  let emisorDireccion = process.env.EMISOR_DIRECCION || 'Guatemala';
  let emisorTelefono = process.env.EMISOR_TELEFONO || '';
  let emisorWeb = process.env.EMISOR_WEB || '';

  try {
    const configs = await prisma.config.findMany({
      where: { clave: { in: ['resend_api_key', 'email_from', 'emisor_nombre', 'emisor_nit', 'emisor_direccion', 'emisor_telefono', 'emisor_web'] } }
    });
    const configMap = Object.fromEntries(configs.map(c => [c.clave, c.valor]));

    if (configMap['resend_api_key']) apiKey = configMap['resend_api_key'];
    if (configMap['email_from']) from = configMap['email_from'];
    if (configMap['emisor_nombre']) emisorNombre = configMap['emisor_nombre'];
    if (configMap['emisor_nit']) emisorNit = configMap['emisor_nit'];
    if (configMap['emisor_direccion']) emisorDireccion = configMap['emisor_direccion'];
    if (configMap['emisor_telefono']) emisorTelefono = configMap['emisor_telefono'];
    if (configMap['emisor_web']) emisorWeb = configMap['emisor_web'];
  } catch {}

  if (!apiKey) throw new Error('RESEND_API_KEY no configurado');

  const rows = cot.items.map(it => `
    <tr>
      <td style="padding:8px 12px;font-size:11px;color:#1581E3;font-family:Courier New,monospace;border-bottom:1px solid #e3e1d8">${it.codigo || ''}</td>
      <td style="padding:8px 12px;font-size:12px;border-bottom:1px solid #e3e1d8">${it.descripcion}</td>
      <td style="padding:8px 12px;font-size:12px;text-align:center;border-bottom:1px solid #e3e1d8">${it.cantidad}</td>
      <td style="padding:8px 12px;font-size:12px;text-align:right;border-bottom:1px solid #e3e1d8">Q ${Number(it.precioUnitario).toFixed(2)}</td>
      <td style="padding:8px 12px;font-size:12px;font-weight:700;text-align:right;border-bottom:1px solid #e3e1d8">Q ${Number(it.totalItem).toFixed(2)}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f3ef;font-family:Arial,Helvetica,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f3ef;padding:16px 0">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border:1.5px solid #d8d6cd;border-radius:6px;overflow:hidden">

  <tr><td style="background:#fff;padding:20px 24px;border-bottom:2px solid #18181b">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="vertical-align:middle">
          <div style="font-size:17px;font-weight:700;color:#18181b">${emisorNombre}</div>
          <div style="font-size:10px;color:#8a887e;margin-top:2px">NIT: ${emisorNit} · ${emisorDireccion}</div>
        </td>
        <td style="text-align:right;vertical-align:top">
          <div style="font-size:9px;font-weight:700;color:#8a887e;text-transform:uppercase;letter-spacing:1px">Cotización</div>
          <div style="font-size:20px;font-weight:700;color:#18181b;font-family:Courier New,monospace">${cot.numero}</div>
          <div style="font-size:10px;color:#52524d;margin-top:2px">${new Date(cot.createdAt).toLocaleDateString('es-GT')}</div>
        </td>
      </tr>
    </table>
  </td></tr>

  <tr><td style="padding:16px 24px;background:#f4f3ef;border-bottom:1px solid #d8d6cd">
    <div style="font-size:9px;font-weight:700;color:#8a887e;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">Cliente</div>
    <div style="font-size:14px;font-weight:700;color:#18181b">${cot.clienteNombre}</div>
    <div style="font-size:11px;color:#52524d;margin-top:2px">NIT: ${cot.clienteNit || 'CF'}</div>
  </td></tr>

  <tr><td style="padding:0">
    <table width="100%" cellpadding="0" cellspacing="0">
      <thead>
        <tr style="background:#18181b">
          <th style="padding:9px 12px;text-align:left;font-size:10px;font-weight:700;color:#fff">Código</th>
          <th style="padding:9px 12px;text-align:left;font-size:10px;font-weight:700;color:#fff">Descripción</th>
          <th style="padding:9px 12px;text-align:center;font-size:10px;font-weight:700;color:#fff">Cant.</th>
          <th style="padding:9px 12px;text-align:right;font-size:10px;font-weight:700;color:#fff">Precio</th>
          <th style="padding:9px 12px;text-align:right;font-size:10px;font-weight:700;color:#fff">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </td></tr>

  <tr><td style="padding:16px 24px;text-align:right;border-top:2px solid #18181b">
    <table cellpadding="0" cellspacing="0" style="margin-left:auto">
      <tr><td style="padding:3px 12px 3px 0;font-size:11px;color:#8a887e;text-align:right">Subtotal:</td><td style="font-size:11px;font-family:Courier New,monospace;text-align:right;color:#18181b">Q ${cot.subtotal.toFixed(2)}</td></tr>
      ${cot.descuento > 0 ? `<tr><td style="padding:3px 12px 3px 0;font-size:11px;color:#b13a2e;text-align:right">Descuento:</td><td style="font-size:11px;font-family:Courier New,monospace;color:#b13a2e;text-align:right">-Q ${cot.descuento.toFixed(2)}</td></tr>` : ''}
      <tr><td style="padding:3px 12px 3px 0;font-size:11px;color:#d97706;text-align:right">IVA (5% Incluido):</td><td style="font-size:11px;font-family:Courier New,monospace;color:#d97706;text-align:right">Q ${(cot.total - (cot.total / 1.05)).toFixed(2)}</td></tr>
      <tr><td colspan="2" style="padding:4px 0"><div style="border-top:1px solid #d8d6cd;margin:4px 0"></div></td></tr>
      <tr><td style="padding:3px 12px 3px 0;font-size:15px;font-weight:700;color:#18181b;text-align:right">TOTAL A PAGAR:</td><td style="font-size:18px;font-weight:700;color:#1581E3;font-family:Courier New,monospace;text-align:right">Q ${cot.total.toFixed(2)}</td></tr>
    </table>
  </td></tr>

  ${cot.notas ? `<tr><td style="padding:12px 24px;background:#f4f3ef;border-top:1px solid #d8d6cd;font-size:11px;color:#52524d">${cot.notas}</td></tr>` : ''}

  <tr><td style="padding:14px 24px;background:#18181b;text-align:center">
    <div style="font-size:11px;color:rgba(255,255,255,.7)">${emisorNombre} ${emisorTelefono ? `· Tel: ${emisorTelefono}` : ''} ${emisorWeb ? `· ${emisorWeb}` : ''}</div>
  </td></tr>

</table>
</td></tr>
</table>
</body></html>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from, to: email,
      subject: `Cotización ${cot.numero} — ${emisorNombre}`,
      html,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
}
