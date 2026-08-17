export interface RankableProduct {
  codigo?: string | null;
  nombre: string;
  descripcion?: string | null;
  categoria?: string | null;
  stock?: number;
}

export class SearchRanker {
  static calculateProductScore(
    item: RankableProduct,
    query: string,
    prioritizeInStock: boolean = false
  ): { score: number; matchedFields: string[] } {
    const q = query.trim().toLowerCase();
    if (!q) return { score: 0, matchedFields: [] };

    let score = 0;
    const matchedFields: string[] = [];

    const codigo = (item.codigo || '').trim().toLowerCase();
    const nombre = (item.nombre || '').trim().toLowerCase();
    const descripcion = (item.descripcion || '').trim().toLowerCase();
    const categoria = (item.categoria || '').trim().toLowerCase();

    // 1. Código exacto (score: 100)
    if (codigo && codigo === q) {
      score += 100;
      matchedFields.push('codigo');
    }
    // 2. Código empieza con búsqueda (score: 80)
    else if (codigo && codigo.startsWith(q)) {
      score += 80;
      matchedFields.push('codigo');
    }

    // 3. Nombre exacto (score: 70)
    if (nombre === q) {
      score += 70;
      matchedFields.push('nombre');
    }
    // 4. Nombre empieza con búsqueda (score: 60)
    else if (nombre.startsWith(q)) {
      score += 60;
      matchedFields.push('nombre');
    }
    // 5. Todas las palabras aparecen en nombre (score: 40)
    else {
      const words = q.split(/\s+/).filter(Boolean);
      if (words.length > 0 && words.every(w => nombre.includes(w))) {
        score += 40;
        matchedFields.push('nombre');
      } else if (nombre.includes(q)) {
        score += 30;
        matchedFields.push('nombre');
      }
    }

    // 6. Coincidencia parcial en descripción o categoría (score: 20)
    if (descripcion && descripcion.includes(q)) {
      score += 20;
      matchedFields.push('descripcion');
    }
    if (categoria && categoria.includes(q)) {
      score += 20;
      matchedFields.push('categoria');
    }

    // Bonificación por presencia en inventario cuando el contexto es VENTA
    if (prioritizeInStock && (item.stock || 0) > 0 && score > 0) {
      score += 5;
    }

    return { score, matchedFields };
  }
}
