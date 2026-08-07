import { Garantia, Reclamo } from '../services/garantias.service'

export function printGarantia(g: any) {
  const w = window.open('', '_blank', 'width=750,height=600')
  if (!w) {
    alert('Por favor autoriza las ventanas emergentes (popups) para imprimir el PDF.');
    return;
  }
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  *{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',sans-serif;font-size:11px;padding:24px;color:#0f172a}
  .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;padding-bottom:12px;border-bottom:2px solid #2563eb}
  .logo{font-size:18px;font-weight:800}.logo span{color:#2563eb}
  .banner{background:#16a34a;color:#fff;text-align:center;padding:8px;font-size:14px;font-weight:700;letter-spacing:3px;border-radius:5px;margin-bottom:14px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px}
  .row{display:flex;gap:6px;margin-bottom:5px;font-size:10px}.lbl{font-weight:700;min-width:90px;color:#374151}.val{color:#475569}
  .cond{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:10px;margin:12px 0;font-size:10px}
  .sign{border-top:1px solid #0f172a;padding-top:4px;font-size:10px;font-weight:700;margin-top:20px}
  .footer{margin-top:14px;text-align:center;font-size:9px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:8px}
</style></head><body>
<div class="header"><div><div class="logo">Web<span>Soft</span> Solutions</div><div style="font-size:9px;color:#64748b">Guastatoya · Tel: 3836-1044</div></div>
<div style="text-align:right;font-size:10px;color:#64748b">Garantía: <b style="color:#16a34a;font-size:14px">${g.numero}</b></div></div>
<div class="banner">CERTIFICADO DE GARANTÍA</div>
<div class="grid">
<div>
  <div class="row"><span class="lbl">Cliente:</span><span class="val">${g.clienteNombre}</span></div>
  <div class="row"><span class="lbl">NIT:</span><span class="val">${g.clienteNit || 'CF'}</span></div>
  <div class="row"><span class="lbl">Teléfono:</span><span class="val">${g.clienteTelefono || ''}</span></div>
</div>
<div>
  <div class="row"><span class="lbl">Producto:</span><span class="val"><b>${g.productoNombre}</b></span></div>
  <div class="row"><span class="lbl">No. Serie:</span><span class="val">${g.productoSerie || ''}</span></div>
  <div class="row"><span class="lbl">Factura:</span><span class="val">${g.ventaNumero || ''}</span></div>
  <div class="row"><span class="lbl">Fecha venta:</span><span class="val">${new Date(g.fechaVenta).toLocaleDateString('es-GT')}</span></div>
  <div class="row"><span class="lbl">Vence:</span><span class="val"><b style="color:#16a34a">${new Date(g.fechaVencimiento).toLocaleDateString('es-GT')}</b></span></div>
  <div class="row"><span class="lbl">Duración:</span><span class="val">${g.diasGarantia} días</span></div>
</div>
</div>
<div class="cond"><b>Condiciones:</b><br>${g.condiciones || ''}</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
  <div><div class="sign">Firma del cliente: ___________________</div></div>
  <div><div class="sign">WebSoft Solutions: ___________________</div></div>
</div>
<div class="footer">WebSoft Solutions · ${g.numero}</div>
</body></html>`)
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 300);
}

export function printReclamo(r: any, g: Garantia) {
  const w = window.open('', '_blank', 'width=750,height=600')
  if (!w) {
    alert('Por favor autoriza las ventanas emergentes (popups) para imprimir el PDF.');
    return;
  }
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  *{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',sans-serif;font-size:11px;padding:24px;color:#0f172a}
  .header{display:flex;justify-content:space-between;margin-bottom:16px;padding-bottom:12px;border-bottom:2px solid #dc2626}
  .logo{font-size:18px;font-weight:800}.logo span{color:#2563eb}
  .banner{background:#dc2626;color:#fff;text-align:center;padding:8px;font-size:14px;font-weight:700;letter-spacing:3px;border-radius:5px;margin-bottom:14px}
  .row{display:flex;gap:6px;margin-bottom:5px;font-size:10px}.lbl{font-weight:700;min-width:120px;color:#374151}.val{color:#475569}
  .falla{background:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:10px;margin:10px 0;font-size:10px}
  .sign{border-top:1px solid #0f172a;padding-top:4px;font-size:10px;font-weight:700;margin-top:20px}
</style></head><body>
<div class="header"><div><div class="logo">Web<span>Soft</span> Solutions</div><div style="font-size:9px;color:#64748b">Guastatoya · Tel: 3836-1044</div></div>
<div style="text-align:right;font-size:10px"><b style="color:#dc2626;font-size:14px">${r.numero}</b><br>${new Date(r.fecha).toLocaleDateString('es-GT')}</div></div>
<div class="banner">RECLAMO DE GARANTÍA</div>
<div class="row"><span class="lbl">Cliente:</span><span class="val">${r.clienteNombre} (${r.clienteNit || 'CF'})</span></div>
<div class="row"><span class="lbl">Producto:</span><span class="val"><b>${r.productoNombre}</b> ${r.productoSerie ? `(Serie: ${r.productoSerie})` : ''}</span></div>
<div class="row"><span class="lbl">Garantía Ref:</span><span class="val">${r.garantiaNumero}</span></div>
<div class="falla"><b>Motivo del reclamo:</b> ${r.motivoReclamo}<br><br><b>Falla reportada:</b> ${r.descripcionFalla}</div>
${r.resolucion ? `<div style="font-size:10px;margin-bottom:10px"><b>Resolución:</b> ${r.resolucion}</div>` : ''}
<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:20px">
  <div><div class="sign">Firma del cliente: ___________________</div></div>
  <div><div class="sign">Recibido por: ___________________</div></div>
</div>
</body></html>`)
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 300);
}
