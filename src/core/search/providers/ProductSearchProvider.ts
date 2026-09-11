import { ISearchProvider } from '../contracts/ISearchProvider';
import { SearchRequest } from '../contracts/SearchRequest';
import { SearchResult, SearchHit } from '../contracts/SearchResult';
import { SearchContextManager } from '../domain/SearchContext';
import { SearchRanker } from '../domain/SearchRanker';
import { prisma } from '@/lib/prisma';

export class ProductSearchProvider implements ISearchProvider {
  readonly entity = 'PRODUCT';

  async search(request: SearchRequest): Promise<SearchResult> {
    const startTime = Date.now();
    const rawQuery = (request.query || '').trim();
    const limit = Math.min(Math.max(1, request.limit || 50), 100);
    const offset = Math.max(0, request.offset || 0);

    const contextRules = SearchContextManager.getRules(request.context);

    // Determinar si filtrar solo activos
    const onlyActive = request.filters?.soloActivos !== undefined
      ? Boolean(request.filters.soloActivos)
      : contextRules.defaultOnlyActive;

    const where: any = {};
    if (onlyActive) {
      where.activo = true;
    }

    if (request.filters?.categoria) {
      where.categoria = { equals: request.filters.categoria, mode: 'insensitive' };
    }

    if (request.filters?.minPrecio !== undefined || request.filters?.maxPrecio !== undefined) {
      where.precio = {};
      if (request.filters.minPrecio !== undefined) where.precio.gte = Number(request.filters.minPrecio);
      if (request.filters.maxPrecio !== undefined) where.precio.lte = Number(request.filters.maxPrecio);
    }

    if (rawQuery) {
      const words = rawQuery.split(/\s+/).filter(Boolean);
      where.OR = [
        { codigo: { contains: rawQuery, mode: 'insensitive' } },
        { nombre: { contains: rawQuery, mode: 'insensitive' } },
        { descripcion: { contains: rawQuery, mode: 'insensitive' } },
        { categoria: { contains: rawQuery, mode: 'insensitive' } },
        ...(words.length > 1 ? words.map(w => ({ nombre: { contains: w, mode: 'insensitive' as const } })) : []),
      ];
    }

    // Consulta acotada a nivel servidor en base de datos
    const dbProducts = await prisma.producto.findMany({
      where,
      take: Math.min(limit * 3, 200), // Muestra segura para ranking en servidor
      select: {
        id: true,
        codigo: true,
        nombre: true,
        descripcion: true,
        precio: true,
        costo: true,
        stock: true,
        stockMinimo: true,
        categoria: true,
        unidad: true,
        activo: true,
        imagenUrl: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Ranking determinista
    const scoredHits: SearchHit[] = dbProducts
      .map(p => {
        const { score, matchedFields } = rawQuery
          ? SearchRanker.calculateProductScore(p, rawQuery, contextRules.prioritizeInStock)
          : { score: 10, matchedFields: [] };

        // Excluir información sensible de costo si no se solicita/autoriza
        const item: any = { ...p };
        if (!request.includeCost) {
          delete item.costo;
        }

        return {
          id: p.id,
          entity: this.entity,
          score,
          matchedFields,
          item,
        };
      })
      .filter(hit => hit.score > 0)
      .sort((a, b) => b.score - a.score || (b.item.stock || 0) - (a.item.stock || 0));

    const total = scoredHits.length;
    const paginatedHits = scoredHits.slice(offset, offset + limit);

    return {
      query: rawQuery,
      total,
      limit,
      offset,
      executionTimeMs: Date.now() - startTime,
      hits: paginatedHits,
    };
  }
}
