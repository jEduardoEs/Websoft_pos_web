import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { SearchEngine } from '@/core/search/SearchEngine';
import { SearchEntity, SearchRequest } from '@/core/search/contracts/SearchRequest';
import { tienePermiso, parsePermisos } from '@/lib/permisos';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    let query = (searchParams.get('q') || searchParams.get('query') || '').trim();
    if (query.length > 200) {
      query = query.substring(0, 200);
    }

    const entity = (searchParams.get('entity') || 'PRODUCT').toUpperCase() as SearchEntity;
    const context = (searchParams.get('context') || 'GLOBAL').toUpperCase();

    const userRole = (session.user as any)?.rol || (session.user as any)?.role || 'cajero';
    const userPermisos = parsePermisos((session.user as any)?.permisos);

    // Mapeo de contexto de búsqueda a módulo de permisos
    let moduloRequerido = 'pos';
    if (context === 'COTIZACION') moduloRequerido = 'cotizaciones';
    else if (context === 'INVENTARIO') moduloRequerido = 'inventario';
    else if (context === 'VENTA') moduloRequerido = 'pos';
    else if (context === 'GARANTIA') moduloRequerido = 'garantias';
    else if (context === 'PROYECTO') moduloRequerido = 'proyectos';
    else if (context === 'GLOBAL') moduloRequerido = 'pos';

    // Validar permiso de módulo según rol y permisos explícitos del usuario
    if (!tienePermiso(userPermisos, moduloRequerido, userRole)) {
      return NextResponse.json(
        { ok: false, error: `No tienes permisos para realizar búsquedas en el módulo '${moduloRequerido}'` },
        { status: 403 }
      );
    }

    const limitParam = parseInt(searchParams.get('limit') || '50', 10);
    const limit = isNaN(limitParam) ? 50 : Math.min(Math.max(1, limitParam), 100);

    const offsetParam = parseInt(searchParams.get('offset') || '0', 10);
    const offset = isNaN(offsetParam) ? 0 : Math.max(0, offsetParam);

    // Permisos para ver costo (solo admin / supervisor / módulo inventario)
    const canSeeCost = userRole === 'admin' || userRole === 'supervisor' || tienePermiso(userPermisos, 'inventario', userRole);
    const requestedIncludeCost = searchParams.get('includeCost') === 'true';
    const includeCost = canSeeCost && requestedIncludeCost;

    const categoria = searchParams.get('categoria') || undefined;
    const soloActivosParam = searchParams.get('soloActivos');
    const soloActivos = soloActivosParam !== null ? soloActivosParam === 'true' : undefined;

    const minPrecioParam = searchParams.get('minPrecio');
    const minPrecio = minPrecioParam ? parseFloat(minPrecioParam) : undefined;

    const maxPrecioParam = searchParams.get('maxPrecio');
    const maxPrecio = maxPrecioParam ? parseFloat(maxPrecioParam) : undefined;

    const request: SearchRequest = {
      query,
      entity,
      context,
      limit,
      offset,
      includeCost,
      filters: {
        ...(categoria ? { categoria } : {}),
        ...(soloActivos !== undefined ? { soloActivos } : {}),
        ...(minPrecio !== undefined && !isNaN(minPrecio) ? { minPrecio } : {}),
        ...(maxPrecio !== undefined && !isNaN(maxPrecio) ? { maxPrecio } : {}),
      },
    };

    const engine = SearchEngine.getInstance();
    const result = await engine.execute(request);

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message || 'Error en el motor de búsqueda' },
      { status: 400 }
    );
  }
}
