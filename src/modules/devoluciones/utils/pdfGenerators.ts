function safeDate(val: any): string {
  if (!val) return '—';
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    return d.toLocaleDateString('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return '—';
  }
}

export function printDevolucion(devolucion: any) {
  if (!devolucion) return;
  const w = window.open('', '_blank', 'width=750,height=700');
  if (!w) {
    alert('Por favor autoriza las ventanas emergentes (popups) para imprimir el PDF.');
    return;
  }

  const fmt = (n: number) => `Q ${Number(n || 0).toFixed(2)}`;
  const devIdStr = String(devolucion.id || '0').padStart(5, '0');
  
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Comprobante de Devolución DEV-${devIdStr}</title>
<style>
@page { size: auto; margin: 5mm; }
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',sans-serif;font-size:11px;padding:20px;color:#0f172a}
.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;padding-bottom:12px;border-bottom:2px solid #2563eb}
.logo{font-size:18px;font-weight:800}.logo span{color:#2563eb}
.title{background:#2563eb;color:#fff;text-align:center;padding:8px;font-size:14px;font-weight:700;letter-spacing:3px;border-radius:5px;margin-bottom:14px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;font-size:10px}
.row{display:flex;gap:6px;margin-bottom:4px}.lbl{font-weight:700;min-width:90px;color:#374151}.val{color:#475569}
.falla{background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:10px;margin-bottom:12px;font-size:11px}
.sign{border-top:1px solid #0f172a;padding-top:4px;font-size:10px;font-weight:700;margin-top:40px;text-align:center}
.footer{margin-top:16px;text-align:center;font-size:9px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:8px}
table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 10px; }
th, td { padding: 6px; text-align: left; border-bottom: 1px solid #e2e8f0; }
th { background: #f1f5f9; font-weight: 700; color: #475569; }
.text-right { text-align: right; }
</style></head><body>
<div class="header">
  <div>
    <div class="logo">Web<span>Soft</span> Solutions</div>
    <div style="font-size:9px;color:#64748b">Guastatoya, El Progreso · Tel: 3836-1044</div>
  </div>
  <div style="text-align:right;font-size:10px;color:#64748b">
    Comprobante: <b style="color:#2563eb;font-size:14px">DEV-${devIdStr}</b><br>
    Fecha: ${safeDate(devolucion.fecha)}
  </div>
</div>
<div class="title">COMPROBANTE DE DEVOLUCIÓN</div>

<div class="grid">
  <div>
    <div class="row"><span class="lbl">Cliente:</span><span class="val">${devolucion.venta?.clienteNombre || 'Consumidor Final'}</span></div>
    <div class="row"><span class="lbl">NIT:</span><span class="val">${devolucion.venta?.clienteNit || 'CF'}</span></div>
  </div>
  <div>
    <div class="row"><span class="lbl">Venta Ref:</span><span class="val">${devolucion.ventaNumero || '—'}</span></div>
    <div class="row"><span class="lbl">Atendido por:</span><span class="val">${devolucion.usuarioNombre || ''}</span></div>
  </div>
</div>

<div class="falla">
  <strong>Motivo de la Devolución:</strong><br>
  ${devolucion.motivo}
</div>

<table>
  <thead>
    <tr>
      <th>Producto</th>
      <th class="text-right">Cant.</th>
      <th class="text-right">Precio</th>
      <th class="text-right">Subtotal</th>
    </tr>
  </thead>
  <tbody>
    ${(devolucion.items || []).map((item: any) => `
      <tr>
        <td>${item.nombre}</td>
        <td class="text-right">${item.cantidad}</td>
        <td class="text-right">${fmt(item.precioUnitario)}</td>
        <td class="text-right">${fmt(item.subtotal)}</td>
      </tr>
    `).join('')}
  </tbody>
</table>

<div style="text-align: right; margin-bottom: 30px;">
  <span style="font-size: 11px; font-weight: 700; color: #475569;">Total Devuelto: </span>
  <strong style="font-size: 16px; color: #dc2626;">${fmt(devolucion.totalDevuelto)}</strong>
</div>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:20px;padding: 0 40px">
  <div><div class="sign">Firma del Cliente</div></div>
  <div><div class="sign">Firma Autorizada</div></div>
</div>
<div class="footer">WebSoft Solutions · Sistema POS · DEV-${String(devolucion.id).padStart(5, '0')}</div>
</body></html>`

  w.document.write(html)
  w.document.close()
  w.focus()
  setTimeout(() => w.print(), 300)
}
