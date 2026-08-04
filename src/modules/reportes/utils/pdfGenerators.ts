export function exportarInventarioPDF(invReporte: any) {
  if (!invReporte) return
  const { resumen, porCategoria } = invReporte
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:Arial,sans-serif;font-size:11px;color:#0f172a;padding:20px}
    .header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:12px;border-bottom:2px solid #2563eb;margin-bottom:16px}
    .logo{font-size:18px;font-weight:700}.logo span{color:#2563eb}
    .badge{font-size:9px;font-weight:700;background:#2563eb;color:#fff;padding:3px 10px;border-radius:20px}
    .kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px}
    .kpi{border:1px solid #e2e8f0;border-radius:6px;padding:10px 12px;border-top:3px solid}
    .kpi-label{font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:4px}
    .kpi-value{font-size:16px;font-weight:700}
    table{width:100%;border-collapse:collapse;margin-bottom:14px}
    th{background:#f8fafc;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;padding:7px 10px;text-align:left;border-bottom:1px solid #e2e8f0}
    td{padding:7px 10px;font-size:11px;border-bottom:1px solid #f1f5f9}
    .right{text-align:right}.center{text-align:center}
    .total-row td{font-weight:700;background:#f8fafc;border-top:2px solid #e2e8f0}
    .footer{margin-top:16px;padding-top:10px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;font-size:9px;color:#94a3b8}
    @media print{@page{margin:8mm;size:A4}}
  </style></head><body>
  <div class="header">
    <div><div class="logo">Web<span>Soft</span> Solutions</div><div style="font-size:9px;color:#64748b;margin-top:2px">Guastatoya, El Progreso</div></div>
    <div style="text-align:right"><div class="badge">VALORACION DE INVENTARIO</div><div style="font-size:9px;color:#64748b;margin-top:5px">Generado: ${new Date().toLocaleDateString('es-GT')}</div></div>
  </div>
  <div class="kpis">
    <div class="kpi" style="border-top-color:#2563eb"><div class="kpi-label">Total productos</div><div class="kpi-value" style="color:#2563eb">${resumen.totalProductos}</div></div>
    <div class="kpi" style="border-top-color:#d97706"><div class="kpi-label">Inversion total</div><div class="kpi-value" style="color:#d97706">Q ${resumen.totalInversion.toFixed(2)}</div></div>
    <div class="kpi" style="border-top-color:#16a34a"><div class="kpi-label">Valor de venta</div><div class="kpi-value" style="color:#16a34a">Q ${resumen.totalValorVenta.toFixed(2)}</div></div>
    <div class="kpi" style="border-top-color:#7c3aed"><div class="kpi-label">Ganancia proyectada</div><div class="kpi-value" style="color:#7c3aed">Q ${resumen.gananciaProyectada.toFixed(2)}</div></div>
  </div>
  <table>
    <thead><tr><th>Categoria</th><th class="center">Productos</th><th class="center">Unidades</th><th class="right">Inversion (costo)</th><th class="right">Valor venta</th><th class="right">Ganancia</th><th class="right">Margen</th></tr></thead>
    <tbody>
      ${porCategoria.map((cat: any) => {
        const gan = cat.valorVenta - cat.inversion
        const mar = cat.inversion > 0 ? Math.round((gan/cat.inversion)*100) : 0
        return `<tr><td style="font-weight:600">${cat.categoria}</td><td class="center">${cat.items}</td><td class="center">${cat.stock}</td><td class="right">Q ${cat.inversion.toFixed(2)}</td><td class="right">Q ${cat.valorVenta.toFixed(2)}</td><td class="right" style="color:#7c3aed">Q ${gan.toFixed(2)}</td><td class="right" style="font-weight:700;color:${mar>=30?'#16a34a':mar>=15?'#d97706':'#dc2626'}">${mar}%</td></tr>`
      }).join('')}
      <tr class="total-row"><td>TOTALES</td><td class="center">${resumen.totalProductos}</td><td class="center">${resumen.totalUnidades}</td><td class="right">Q ${resumen.totalInversion.toFixed(2)}</td><td class="right">Q ${resumen.totalValorVenta.toFixed(2)}</td><td class="right">Q ${resumen.gananciaProyectada.toFixed(2)}</td><td class="right">${resumen.margenProyectado}%</td></tr>
    </tbody>
  </table>
  <div style="margin-top:10px;padding:10px;background:#fef3c7;border-radius:6px;font-size:10px;color:#92400e"><strong>Alertas:</strong> ${resumen.productosStockBajo} productos con stock bajo · ${resumen.productosAgotados} productos agotados</div>
  <div class="footer"><span>WebSoft Solutions · Guastatoya, El Progreso</span><span>Este reporte es confidencial</span></div>
  <script>window.onload=function(){window.print()}</script></body></html>`
  const w = window.open('', '_blank')
  if (w) { w.document.write(html); w.document.close() }
}

export function exportarPatrimonioPDF(d: any) {
  if (!d) return
  const fmtQ = (n: number) => `Q ${Number(n).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const fmtFecha = (s: string) => new Date(s).toLocaleDateString('es-GT', { day: '2-digit', month: 'long', year: 'numeric' })
  const hoy = fmtFecha(d.fechaReporte)

  const rowsActivos = d.activosFijos.map((a: any, i: number) => `
    <tr style="background:${i % 2 === 0 ? '#fff' : '#f8faff'}">
      <td class="code">${a.codigo}</td>
      <td>${a.nombre}</td>
      <td>${a.descripcion || '—'}</td>
      <td class="center">${fmtFecha(a.fechaAdquisicion)}</td>
      <td class="right">${fmtQ(a.costoOriginal)}</td>
      <td class="right dep">${fmtQ(a.depreciacionAcum)}</td>
      <td class="right bold blue">${fmtQ(a.valorNeto)}</td>
    </tr>`).join('')

  const rowsCategorias = d.porCategoria.map((c: any, i: number) => `
    <tr style="background:${i % 2 === 0 ? '#fff' : '#f8faff'}">
      <td class="bold">${c.categoria}</td>
      <td class="center">${c.items}</td>
      <td class="center">${c.unidades.toLocaleString('es-GT')}</td>
      <td class="right dep">${fmtQ(c.valorVenta)}</td>
      <td class="right bold blue">${fmtQ(c.valorCosto)}</td>
    </tr>`).join('')

  const rowsProductos = d.productos.map((p: any, i: number) => `
    <tr style="background:${i % 2 === 0 ? '#fff' : '#f8faff'}">
      <td class="code">${p.codigo || '—'}</td>
      <td>${p.nombre}</td>
      <td class="center">${p.categoria}</td>
      <td class="center">${p.stock}</td>
      <td class="right">${fmtQ(p.costo)}</td>
      <td class="right bold blue">${fmtQ(p.stock * p.costo)}</td>
    </tr>`).join('')

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Inter',Arial,sans-serif;font-size:11px;color:#0f172a;padding:24px 28px;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px}
  .logo-wrap{display:flex;align-items:center;gap:12px}
  .logo-img{width:52px;height:52px;border-radius:10px;object-fit:contain}
  .brand-name{font-size:19px;font-weight:700;color:#0f172a;line-height:1}
  .brand-name span{color:#2563eb}
  .brand-sub{font-size:8px;letter-spacing:2px;color:#64748b;font-weight:600;margin-top:3px;text-transform:uppercase}
  .co-info{text-align:right;font-size:9.5px;color:#475569;line-height:1.7}
  .co-info strong{font-size:13px;font-weight:700;color:#0f172a;display:block;margin-bottom:2px}
  .banner{background:#2563eb;color:#fff;text-align:center;padding:8px;font-size:14px;font-weight:700;letter-spacing:5px;border-radius:6px;margin-bottom:10px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .hr-blue{height:2px;background:#2563eb;margin:8px 0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .hr-light{height:1px;background:#e2e8f0;margin:7px 0}
  .meta{display:flex;justify-content:space-between;font-size:9.5px;margin-bottom:8px}
  .confidencial{font-size:9px;font-weight:700;color:#2563eb;letter-spacing:2px}
  .kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:12px}
  .kpi{border:1px solid #e2e8f0;border-radius:6px;padding:9px 11px;border-top:3px solid #2563eb;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .kpi.g{border-top-color:#16a34a}.kpi.a{border-top-color:#d97706}.kpi.p{border-top-color:#7c3aed}
  .kpi-label{font-size:8px;color:#64748b;text-transform:uppercase;font-weight:600;margin-bottom:4px}
  .kpi-value{font-size:14px;font-weight:700;color:#2563eb}
  .kpi.g .kpi-value{color:#16a34a}.kpi.a .kpi-value{color:#d97706}.kpi.p .kpi-value{color:#7c3aed}
  .kpi-sub{font-size:7.5px;color:#94a3b8;margin-top:2px}
  .total-res{display:flex;justify-content:space-between;align-items:center;background:#f0f9ff;border:1.5px solid #bfdbfe;border-radius:8px;padding:10px 14px;margin-bottom:12px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .total-res-label{font-size:11px;font-weight:700;color:#1e40af}
  .total-res-sub{font-size:8.5px;color:#64748b;margin-top:2px}
  .total-res-value{font-size:20px;font-weight:800;color:#2563eb}
  .sec-title{font-size:10px;font-weight:700;color:#1e40af;text-transform:uppercase;letter-spacing:1px;margin:12px 0 5px;padding-bottom:4px;border-bottom:2px solid #bfdbfe;display:flex;justify-content:space-between;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .sec-title span{color:#2563eb}
  table{width:100%;border-collapse:collapse;margin-bottom:10px}
  thead tr{background:#eff6ff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  thead th{padding:6px 8px;font-size:9px;font-weight:700;text-align:left;color:#1e40af;border-bottom:2px solid #bfdbfe}
  tbody tr:nth-child(even){background:#f8fafc}
  tbody td{padding:5px 8px;border-bottom:1px solid #f1f5f9;font-size:9.5px}
  .tr-total td{font-weight:700;background:#eff6ff;border-top:2px solid #bfdbfe;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .code{font-family:monospace;font-size:8.5px;color:#2563eb;font-weight:700}
  .right{text-align:right}.center{text-align:center}.bold{font-weight:700}.dep{color:#94a3b8}.blue{color:#2563eb;font-weight:700}
  .nota{font-size:8.5px;color:#64748b;line-height:1.6;background:#f0f9ff;border-left:3px solid #2563eb;padding:7px 12px;border-radius:0 6px 6px 0;margin-bottom:10px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .nota strong{color:#374151}
  .signs{display:grid;grid-template-columns:1fr 1fr 1fr;gap:24px;margin-top:18px}
  .sign-line{border-top:1.5px solid #0f172a;padding-top:4px;font-size:9px;font-weight:700;text-align:center}
  .sign-sub{font-size:8px;color:#64748b;text-align:center;margin-top:2px}
  .footer{margin-top:14px;padding-top:8px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;font-size:8.5px;color:#94a3b8}
  @media print{body{padding:12px}@page{margin:8mm;size:A4}}
</style>
</head><body>
<div class="header">
  <div class="logo-wrap">
    <img class="logo-img" src="https://websoftsolutions.com.gt/logo.png" alt="Logo" onerror="this.style.display='none'">
    <div>
      <div class="brand-name">Web<span>Soft</span> Solutions</div>
      <div class="brand-sub">Guastatoya · El Progreso · Guatemala</div>
    </div>
  </div>
  <div class="co-info">
    <strong>WEBSOFT SOLUTIONS</strong>
    NIT: ${d.empresa.nit}<br>
    ${d.empresa.direccion}<br>
    TEL: ${d.empresa.telefono} · ${d.empresa.web}
  </div>
</div>
<div class="banner">E S T A D O &nbsp; D E &nbsp; P A T R I M O N I O</div>
<div class="hr-blue"></div>
<div class="meta">
  <span><strong>Fecha de corte:</strong> ${hoy}</span>
  <span class="confidencial">CONFIDENCIAL</span>
  <span><strong>Generado:</strong> ${new Date().toLocaleString('es-GT')}</span>
</div>
<div class="hr-blue"></div>
<div class="kpis">
  <div class="kpi"><div class="kpi-label">Activos fijos — valor neto</div><div class="kpi-value">${fmtQ(d.resumenActivos.valorNeto)}</div><div class="kpi-sub">Bruto: ${fmtQ(d.resumenActivos.valorBruto)}</div></div>
  <div class="kpi g"><div class="kpi-label">Inventario — valor de costo</div><div class="kpi-value">${fmtQ(d.resumenInventario.valorCosto)}</div><div class="kpi-sub">${d.resumenInventario.totalProductos} productos · ${d.resumenInventario.totalUnidades.toLocaleString('es-GT')} uds.</div></div>
  <div class="kpi a"><div class="kpi-label">Inventario — valor de venta</div><div class="kpi-value">${fmtQ(d.resumenInventario.valorVenta)}</div><div class="kpi-sub">Precio de mercado al ${hoy}</div></div>
  <div class="kpi p"><div class="kpi-label">Activos fijos registrados</div><div class="kpi-value">${d.resumenActivos.cantidad}</div><div class="kpi-sub">En operación activa</div></div>
</div>
<div class="total-res">
  <div><div class="total-res-label">Patrimonio total estimado</div><div class="total-res-sub">Activos fijos (valor neto) + Inventario (valor de costo)</div></div>
  <div class="total-res-value">${fmtQ(d.totalPatrimonio)}</div>
</div>
<div class="hr-light"></div>
<div class="sec-title">1. Activos Fijos <span>Valor neto: ${fmtQ(d.resumenActivos.valorNeto)}</span></div>
<table>
  <thead><tr><th style="width:65px">Código</th><th>Descripción</th><th>Observaciones</th><th style="width:80px;text-align:center">Fecha adq.</th><th style="width:88px;text-align:right">Costo original</th><th style="width:80px;text-align:right">Dep. acum.</th><th style="width:82px;text-align:right">Valor neto</th></tr></thead>
  <tbody>${rowsActivos}<tr class="tr-total"><td colspan="4">TOTAL ACTIVOS FIJOS</td><td class="right">${fmtQ(d.resumenActivos.valorBruto)}</td><td class="right dep">${fmtQ(d.resumenActivos.depreciacionAcum)}</td><td class="right blue">${fmtQ(d.resumenActivos.valorNeto)}</td></tr></tbody>
</table>
<div class="sec-title">2. Inventario — Resumen por Categoría <span>Valor costo: ${fmtQ(d.resumenInventario.valorCosto)}</span></div>
<table>
  <thead><tr><th>Categoría</th><th style="width:70px;text-align:center">Productos</th><th style="width:70px;text-align:center">Unidades</th><th style="width:95px;text-align:right">Valor de venta</th><th style="width:95px;text-align:right">Valor de costo</th></tr></thead>
  <tbody>${rowsCategorias}<tr class="tr-total"><td>TOTAL INVENTARIO</td><td class="center">${d.resumenInventario.totalProductos}</td><td class="center">${d.resumenInventario.totalUnidades.toLocaleString('es-GT')}</td><td class="right dep">${fmtQ(d.resumenInventario.valorVenta)}</td><td class="right blue">${fmtQ(d.resumenInventario.valorCosto)}</td></tr></tbody>
</table>
<div class="sec-title">3. Inventario — Detalle por Producto <span>${d.resumenInventario.totalProductos} productos</span></div>
<table>
  <thead><tr><th style="width:80px">Código</th><th>Producto</th><th style="width:100px;text-align:center">Categoría</th><th style="width:55px;text-align:center">Stock</th><th style="width:88px;text-align:right">Costo unit.</th><th style="width:88px;text-align:right">Valor total</th></tr></thead>
  <tbody>${rowsProductos}<tr class="tr-total"><td colspan="5">TOTAL INVENTARIO (valor de costo)</td><td class="right blue">${fmtQ(d.resumenInventario.valorCosto)}</td></tr></tbody>
</table>
<div class="nota"><strong>Nota metodológica:</strong> Los activos fijos se presentan a valor neto (costo de adquisición menos depreciación acumulada por línea recta). El inventario se valora al costo promedio de adquisición. Reporte generado automáticamente al ${hoy}. Para efectos bancarios debe ser certificado por contador público y auditor autorizado.</div>
<div class="signs">
  <div><div style="height:32px"></div><div class="sign-line">REPRESENTANTE LEGAL</div><div class="sign-sub">Nombre y firma</div></div>
  <div><div style="height:32px"></div><div class="sign-line">CONTADOR / AUDITOR</div><div class="sign-sub">Colegiado No. ___________</div></div>
  <div><div style="height:32px"></div><div class="sign-line">SELLO DE LA EMPRESA</div><div class="sign-sub">&nbsp;</div></div>
</div>
<div class="footer"><span>WebSoft Solutions · ${d.empresa.web} · NIT: ${d.empresa.nit}</span><span>Sistema POS WebSoft v0.07 · ${hoy}</span></div>
</body></html>`

  const w = window.open('', '_blank', 'width=1000,height=700')
  if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 800) }
}

export function exportarPDFVentas(reporte: any, fi: string, ff: string) {
  if (!reporte) return
  const ivaPct = 5
  const ivaRecaudado = reporte.granTotal * (ivaPct / (100 + ivaPct))
  const diasRows = Object.entries(reporte.porDia)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dia, v]: any) => `<tr><td>${new Date(dia).toLocaleDateString('es-GT')}</td><td class="center">${v.ventas}</td><td class="right">Q ${v.total.toFixed(2)}</td><td class="right">Q ${(v.total / v.ventas).toFixed(2)}</td><td class="center">0</td></tr>`).join('')
  const prodRows = (reporte.topProductos || []).slice(0, 15).map((p: any) =>
    `<tr><td>${p.nombre}</td><td class="center">${p.cantidad}</td><td class="right">Q ${p.total.toFixed(2)}</td><td class="center">${Math.round((p.total / reporte.granTotal) * 100)}%</td></tr>`).join('')
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><style>
    *{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:11px;color:#0f172a;padding:20px}
    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;padding-bottom:14px;border-bottom:2px solid #2563eb}
    .logo{font-size:20px;font-weight:800;color:#0f172a}.logo span{color:#2563eb}
    .badge{font-size:9px;font-weight:700;background:#2563eb;color:#fff;padding:3px 10px;border-radius:20px;letter-spacing:1px}
    .kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:18px}
    .kpi{border:1px solid #e2e8f0;border-radius:8px;padding:12px;border-top:3px solid}
    .kpi-label{font-size:9px;color:#64748b;text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px}
    .kpi-value{font-size:18px;font-weight:800}.kpi-sub{font-size:9px;color:#94a3b8;margin-top:3px}
    table{width:100%;border-collapse:collapse;margin-bottom:14px}
    th{background:#f8fafc;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;padding:7px 10px;text-align:left;border-bottom:1px solid #e2e8f0}
    td{padding:7px 10px;font-size:11px;border-bottom:1px solid #f1f5f9}.center{text-align:center}.right{text-align:right}
    .section-title{font-size:13px;font-weight:700;color:#0f172a;margin:18px 0 10px;border-left:3px solid #2563eb;padding-left:10px}
    .footer{margin-top:20px;padding-top:12px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;font-size:9px;color:#94a3b8}
    @media print{body{padding:14px}@page{margin:8mm;size:A4}}
  </style></head><body>
  <div class="header">
    <div><div class="logo">Web<span>Soft</span> Solutions</div><div style="font-size:9px;color:#64748b;margin-top:3px">Guastatoya, El Progreso</div></div>
    <div style="text-align:right"><div class="badge">REPORTE DE VENTAS</div><div style="font-size:9px;color:#64748b;margin-top:6px">Periodo: ${new Date(fi).toLocaleDateString('es-GT')} – ${new Date(ff).toLocaleDateString('es-GT')}</div></div>
  </div>
  <div class="kpis">
    <div class="kpi" style="border-top-color:#2563eb"><div class="kpi-label">Total ventas</div><div class="kpi-value" style="color:#2563eb">${reporte.totalVentas}</div></div>
    <div class="kpi" style="border-top-color:#16a34a"><div class="kpi-label">Ingresos</div><div class="kpi-value" style="color:#16a34a">Q ${reporte.granTotal.toFixed(2)}</div></div>
    <div class="kpi" style="border-top-color:#d97706"><div class="kpi-label">IVA recaudado</div><div class="kpi-value" style="color:#d97706">Q ${ivaRecaudado.toFixed(2)}</div></div>
    <div class="kpi" style="border-top-color:#7c3aed"><div class="kpi-label">Ticket prom.</div><div class="kpi-value" style="color:#7c3aed">Q ${reporte.totalVentas > 0 ? (reporte.granTotal / reporte.totalVentas).toFixed(2) : '0.00'}</div></div>
  </div>
  <div class="section-title">Ventas por dia</div>
  <table><thead><tr><th>Fecha</th><th class="center">Ventas</th><th class="right">Total</th><th class="right">Ticket prom.</th><th class="center">Dev.</th></tr></thead><tbody>${diasRows}</tbody></table>
  <div class="section-title">Productos mas vendidos</div>
  <table><thead><tr><th>Producto</th><th class="center">Cantidad</th><th class="right">Total</th><th class="center">% ingresos</th></tr></thead><tbody>${prodRows}</tbody></table>
  <div class="footer"><span>WebSoft Solutions · Guastatoya, El Progreso</span><span>Generado el ${new Date().toLocaleDateString('es-GT')}</span></div>
  <script>window.onload=function(){window.print()}</script></body></html>`
  const w = window.open('', '_blank')
  if (w) { w.document.write(html); w.document.close() }
}
