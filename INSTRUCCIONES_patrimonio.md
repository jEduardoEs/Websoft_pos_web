# Reporte de Patrimonio — Instrucciones de integración

Agrega estas 3 cosas en `src/app/(dashboard)/reportes/page.tsx`:

## 1. Estado (junto a los otros useState, línea ~20)

```ts
const [patriLoading, setPatriLoading] = useState(false)
```

## 2. Función (después de exportarPDF)

```ts
const exportarPatrimonioPDF = async () => {
  setPatriLoading(true)
  try {
    const res = await fetch('/api/reportes/patrimonio')
    if (!res.ok) { toast.error('Error al generar reporte'); setPatriLoading(false); return }
    const d = await res.json()

    const fmtQ  = (n: number) => `Q ${Number(n).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    const fmtFecha = (s: string) => new Date(s).toLocaleDateString('es-GT', { day: '2-digit', month: 'long', year: 'numeric' })
    const hoy = fmtFecha(d.fechaReporte)

    // ── Filas activos fijos ───────────────────────────────────────────────
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

    // ── Filas inventario por categoría ────────────────────────────────────
    const rowsCategorias = d.porCategoria.map((c: any, i: number) => `
      <tr style="background:${i % 2 === 0 ? '#fff' : '#f8faff'}">
        <td class="bold">${c.categoria}</td>
        <td class="center">${c.items}</td>
        <td class="center">${c.unidades.toLocaleString('es-GT')}</td>
        <td class="right dep">${fmtQ(c.valorVenta)}</td>
        <td class="right bold blue">${fmtQ(c.valorCosto)}</td>
      </tr>`).join('')

    // ── Filas inventario detalle ──────────────────────────────────────────
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
  body{font-family:'Inter',sans-serif;font-size:11px;color:#0f172a;padding:24px 28px;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px}
  .logo-wrap{display:flex;align-items:center;gap:12px}
  .logo-img{width:56px;height:56px;border-radius:10px;object-fit:contain}
  .brand-name{font-size:20px;font-weight:700;color:#0f172a;line-height:1}
  .brand-name span{color:#2563eb}
  .brand-sub{font-size:8px;letter-spacing:2px;color:#64748b;font-weight:600;margin-top:2px;text-transform:uppercase}
  .co-info{text-align:right;font-size:10px;color:#475569;line-height:1.7}
  .co-info strong{font-size:14px;font-weight:700;color:#0f172a;display:block;margin-bottom:2px}
  .banner{background:#2563eb;color:#fff;text-align:center;padding:9px;font-size:16px;font-weight:700;letter-spacing:5px;border-radius:6px;margin-bottom:14px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .hr-blue{height:2px;background:#2563eb;margin:10px 0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .hr-light{height:1px;background:#e2e8f0;margin:8px 0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px}
  .kpi{border:1px solid #e2e8f0;border-radius:6px;padding:10px 12px;border-top:3px solid #2563eb;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .kpi.green{border-top-color:#16a34a}
  .kpi.amber{border-top-color:#d97706}
  .kpi.purple{border-top-color:#7c3aed}
  .kpi-label{font-size:8.5px;color:#64748b;text-transform:uppercase;font-weight:600;margin-bottom:4px;letter-spacing:.3px}
  .kpi-value{font-size:15px;font-weight:700;color:#2563eb}
  .kpi.green .kpi-value{color:#16a34a}
  .kpi.amber .kpi-value{color:#d97706}
  .kpi.purple .kpi-value{color:#7c3aed}
  .kpi-sub{font-size:8px;color:#94a3b8;margin-top:3px}
  .total-resumen{display:flex;justify-content:space-between;align-items:center;background:#f0f9ff;border:1.5px solid #bfdbfe;border-radius:8px;padding:11px 16px;margin-bottom:14px}
  .total-resumen-label{font-size:11px;font-weight:700;color:#1e40af}
  .total-resumen-sub{font-size:9px;color:#64748b;margin-top:2px}
  .total-resumen-value{font-size:22px;font-weight:800;color:#2563eb}
  .sec-title{font-size:11px;font-weight:700;color:#1e40af;text-transform:uppercase;letter-spacing:1px;margin:14px 0 6px;padding-bottom:4px;border-bottom:2px solid #bfdbfe;display:flex;justify-content:space-between}
  .sec-title span{font-size:11px;font-weight:700;color:#2563eb}
  table{width:100%;border-collapse:collapse;margin-bottom:12px}
  thead tr{background:#eff6ff}
  thead th{padding:7px 9px;font-size:10px;font-weight:700;text-align:left;color:#1e40af;border-bottom:2px solid #bfdbfe}
  tbody tr:nth-child(even){background:#f8fafc}
  tbody td{padding:6px 9px;border-bottom:1px solid #f1f5f9;font-size:10px}
  .total-row td{font-weight:700;background:#eff6ff;border-top:2px solid #bfdbfe}
  .code{font-family:monospace;font-size:9px;color:#2563eb;font-weight:700}
  .right{text-align:right}.center{text-align:center}.bold{font-weight:700}
  .dep{color:#94a3b8}
  .blue{color:#2563eb;font-weight:700}
  .nota{font-size:8.5px;color:#64748b;line-height:1.6;background:#f0f9ff;border-left:3px solid #2563eb;padding:7px 12px;border-radius:0 6px 6px 0;margin-bottom:10px}
  .nota strong{color:#374151}
  .signs{display:grid;grid-template-columns:1fr 1fr 1fr;gap:30px;margin-top:20px}
  .sign-line{border-top:1.5px solid #0f172a;padding-top:4px;font-size:10px;font-weight:700;text-align:center}
  .sign-sub{font-size:8.5px;color:#64748b;text-align:center;margin-top:2px}
  .footer{margin-top:16px;padding-top:10px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;font-size:9px;color:#94a3b8}
  .confidencial{font-size:9px;font-weight:700;color:#2563eb;letter-spacing:2px}
  @media print{body{padding:12px}@page{margin:8mm;size:A4}}
</style>
</head><body>

<div class="header">
  <div class="logo-wrap">
    <img class="logo-img" src="https://websoft-solutions.vercel.app/logo.png" alt="Logo" onerror="this.style.display='none'"/>
    <div>
      <div class="brand-name">Web<span>Soft</span> Solutions</div>
      <div class="brand-sub">Guastatoya · El Progreso · Guatemala</div>
    </div>
  </div>
  <div class="co-info">
    <strong>WEBSOFT SOLUTIONS</strong>
    NIT: \${d.empresa.nit}<br>
    \${d.empresa.direccion}<br>
    TEL: \${d.empresa.telefono}<br>
    \${d.empresa.web}
  </div>
</div>

<div class="banner">E S T A D O &nbsp; D E &nbsp; P A T R I M O N I O</div>
<hr class="blue">

<div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:10px">
  <div><span style="font-weight:700;color:#374151">Fecha de corte:</span> <span style="color:#475569">\${hoy}</span></div>
  <div class="confidencial">CONFIDENCIAL</div>
  <div><span style="font-weight:700;color:#374151">Generado:</span> <span style="color:#475569">\${new Date().toLocaleString('es-GT')}</span></div>
</div>

<hr class="blue">

<div class="kpis">
  <div class="kpi">
    <div class="kpi-label">Activos fijos — valor neto</div>
    <div class="kpi-value">\${fmtQ(d.resumenActivos.valorNeto)}</div>
    <div class="kpi-sub">Bruto: \${fmtQ(d.resumenActivos.valorBruto)}</div>
  </div>
  <div class="kpi green">
    <div class="kpi-label">Inventario — valor de costo</div>
    <div class="kpi-value">\${fmtQ(d.resumenInventario.valorCosto)}</div>
    <div class="kpi-sub">\${d.resumenInventario.totalProductos} productos · \${d.resumenInventario.totalUnidades.toLocaleString('es-GT')} uds.</div>
  </div>
  <div class="kpi amber">
    <div class="kpi-label">Inventario — valor de venta</div>
    <div class="kpi-value">\${fmtQ(d.resumenInventario.valorVenta)}</div>
    <div class="kpi-sub">Precio de mercado al \${hoy}</div>
  </div>
  <div class="kpi purple">
    <div class="kpi-label">Activos fijos registrados</div>
    <div class="kpi-value">\${d.resumenActivos.cantidad}</div>
    <div class="kpi-sub">En operación activa</div>
  </div>
</div>

<div class="total-resumen">
  <div>
    <div class="total-resumen-label">Patrimonio total estimado</div>
    <div class="total-resumen-sub">Activos fijos (valor neto) + Inventario (valor de costo)</div>
  </div>
  <div class="total-resumen-value">\${fmtQ(d.totalPatrimonio)}</div>
</div>

<hr class="light">

<!-- ACTIVOS FIJOS -->
<div class="sec-title">1. Activos Fijos <span>Valor neto: \${fmtQ(d.resumenActivos.valorNeto)}</span></div>
<table>
  <thead><tr>
    <th style="width:70px">Código</th>
    <th>Descripción</th>
    <th>Observaciones</th>
    <th style="width:80px;text-align:center">Fecha adq.</th>
    <th style="width:90px;text-align:right">Costo original</th>
    <th style="width:90px;text-align:right">Dep. acum.</th>
    <th style="width:90px;text-align:right">Valor neto</th>
  </tr></thead>
  <tbody>
    \${rowsActivos}
    <tr class="total-row">
      <td colspan="4">TOTAL ACTIVOS FIJOS</td>
      <td class="right">\${fmtQ(d.resumenActivos.valorBruto)}</td>
      <td class="right dep">\${fmtQ(d.resumenActivos.depreciacionAcum)}</td>
      <td class="right blue">\${fmtQ(d.resumenActivos.valorNeto)}</td>
    </tr>
  </tbody>
</table>

<!-- INVENTARIO RESUMEN -->
<div class="sec-title">2. Inventario — Resumen por Categoría <span>Valor costo: \${fmtQ(d.resumenInventario.valorCosto)}</span></div>
<table>
  <thead><tr>
    <th>Categoría</th>
    <th style="width:70px;text-align:center">Productos</th>
    <th style="width:70px;text-align:center">Unidades</th>
    <th style="width:100px;text-align:right">Valor de venta</th>
    <th style="width:100px;text-align:right">Valor de costo</th>
  </tr></thead>
  <tbody>
    \${rowsCategorias}
    <tr class="total-row">
      <td>TOTAL INVENTARIO</td>
      <td class="center">\${d.resumenInventario.totalProductos}</td>
      <td class="center">\${d.resumenInventario.totalUnidades.toLocaleString('es-GT')}</td>
      <td class="right dep">\${fmtQ(d.resumenInventario.valorVenta)}</td>
      <td class="right blue">\${fmtQ(d.resumenInventario.valorCosto)}</td>
    </tr>
  </tbody>
</table>

<!-- INVENTARIO DETALLE -->
<div class="sec-title">3. Inventario — Detalle por Producto <span>\${d.resumenInventario.totalProductos} productos</span></div>
<table>
  <thead><tr>
    <th style="width:80px">Código</th>
    <th>Producto</th>
    <th style="width:100px;text-align:center">Categoría</th>
    <th style="width:55px;text-align:center">Stock</th>
    <th style="width:90px;text-align:right">Costo unit.</th>
    <th style="width:90px;text-align:right">Valor total</th>
  </tr></thead>
  <tbody>
    \${rowsProductos}
    <tr class="total-row">
      <td colspan="5">TOTAL INVENTARIO (valor de costo)</td>
      <td class="right blue">\${fmtQ(d.resumenInventario.valorCosto)}</td>
    </tr>
  </tbody>
</table>

<div class="nota">
  <strong>Nota metodológica:</strong> Los activos fijos se presentan a valor neto (costo de adquisición menos depreciación acumulada calculada por el método de línea recta). El inventario se valora al costo promedio de adquisición. Este reporte refleja el estado de los registros al \${hoy} y es generado automáticamente por el sistema de gestión WebSoft Solutions. Para efectos bancarios y legales debe ser certificado por contador público y auditor autorizado.
</div>

<div class="signs">
  <div><div style="height:36px"></div><div class="sign-line">REPRESENTANTE LEGAL</div><div class="sign-sub">Nombre y firma</div></div>
  <div><div style="height:36px"></div><div class="sign-line">CONTADOR / AUDITOR</div><div class="sign-sub">Colegiado No. ___________</div></div>
  <div><div style="height:36px"></div><div class="sign-line">SELLO DE LA EMPRESA</div><div class="sign-sub">&nbsp;</div></div>
</div>

<div class="footer">
  <span>WebSoft Solutions · \${d.empresa.web} · NIT: \${d.empresa.nit}</span>
  <span>Sistema POS WebSoft v0.07 · \${hoy}</span>
</div>

</body></html>`
    const w = window.open('', '_blank', 'width=1000,height=700')
    if (w) {
      w.document.write(html)
      w.document.close()
      setTimeout(() => w.print(), 800)
    }
  } catch (e) {
    toast.error('Error al generar reporte')
  }
  setPatriLoading(false)
}

```

## 3. Botón (en el JSX, junto a los otros botones de exportar)

```tsx
<button
  className="btn-primary"
  onClick={exportarPatrimonioPDF}
  disabled={patriLoading}
  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
>
  {patriLoading ? 'Generando...' : 'Reporte de Patrimonio PDF'}
</button>
```
