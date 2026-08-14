export function fmtDate(d?: string | Date | null): string {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('es-GT', { year: 'numeric', month: '2-digit', day: '2-digit' });
  } catch {
    return String(d);
  }
}

export function diasRestantes(g: { fechaVencimiento?: string | Date }): number {
  if (!g.fechaVencimiento) return 0;
  const venc = new Date(g.fechaVencimiento).getTime();
  const hoy = new Date().getTime();
  const diff = Math.ceil((venc - hoy) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}
