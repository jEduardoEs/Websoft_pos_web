export function printOrden(orden: any) {
  const w = window.open('', '_blank', 'width=750,height=700')
  if (!w) {
    alert('Por favor autoriza las ventanas emergentes (popups) para imprimir el PDF.');
    return;
  }
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Orden de Servicio ${orden.numero}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',sans-serif;font-size:11px;padding:20px;color:#0f172a}
.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;padding-bottom:12px;border-bottom:2px solid #2563eb}
.logo{font-size:18px;font-weight:800}.logo span{color:#2563eb}
.title{background:#2563eb;color:#fff;text-align:center;padding:8px;font-size:14px;font-weight:700;letter-spacing:3px;border-radius:5px;margin-bottom:14px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;font-size:10px}
.row{display:flex;gap:6px;margin-bottom:4px}.lbl{font-weight:700;min-width:90px;color:#374151}.val{color:#475569}
.falla{background:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:10px;margin-bottom:12px;font-size:11px}
.falla strong{color:#dc2626}
.sign{border-top:1px solid #0f172a;padding-top:4px;font-size:10px;font-weight:700;margin-top:30px}
.footer{margin-top:16px;text-align:center;font-size:9px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:8px}
</style></head><body>
<div class="header">
<div><div class="logo">Web<span>Soft</span> Solutions</div><div style="font-size:9px;color:#64748b">Guastatoya, El Progreso · Tel: 3836-1044</div></div>
<div style="text-align:right;font-size:10px;color:#64748b">Orden: <b style="color:#2563eb;font-size:14px">${orden.numero}</b><br>Fecha: ${new Date(orden.fecha).toLocaleDateString('es-GT')}</div>
</div>
<div class="title">ORDEN DE SERVICIO TÉCNICO</div>
<div class="grid">
<div>
  <div class="row"><span class="lbl">Cliente:</span><span class="val">${orden.clienteNombre}</span></div>
  <div class="row"><span class="lbl">Teléfono:</span><span class="val">${orden.clienteTelefono || ''}</span></div>
  <div class="row"><span class="lbl">NIT:</span><span class="val">${orden.clienteNit || 'CF'}</span></div>
</div>
<div>
  <div class="row"><span class="lbl">Equipo:</span><span class="val">${orden.tipoEquipo}</span></div>
  <div class="row"><span class="lbl">Marca/Modelo:</span><span class="val">${orden.marca || ''} ${orden.modelo || ''}</span></div>
  <div class="row"><span class="lbl">Serie:</span><span class="val">${orden.serie || ''}</span></div>
  <div class="row"><span class="lbl">Accesorios:</span><span class="val">${orden.accesorios || ''}</span></div>
  <div class="row"><span class="lbl">Fecha promesa:</span><span class="val">${orden.fechaPromesa ? new Date(orden.fechaPromesa).toLocaleDateString('es-GT') : ''}</span></div>
</div>
</div>
<div class="falla"><strong>Descripción de la falla:</strong><br>${orden.descripcionFalla}</div>
${orden.observaciones ? `<div style="font-size:10px;margin-bottom:12px;color:#475569"><strong>Observaciones:</strong> ${orden.observaciones}</div>` : ''}
<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:20px">
<div><div class="sign">Firma del cliente: ___________________</div></div>
<div><div class="sign">Recibido por: ___________________</div></div>
</div>
<div class="footer">WebSoft Solutions · Sistema POS · ${orden.numero}</div>
</body></html>`)
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 300);
}
