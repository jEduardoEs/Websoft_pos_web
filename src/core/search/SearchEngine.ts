import { ISearchProvider } from './contracts/ISearchProvider';
import { SearchRequest } from './contracts/SearchRequest';
import { SearchResult } from './contracts/SearchResult';
import { ProductSearchProvider } from './providers/ProductSearchProvider';

export class SearchEngine {
  private static instance: SearchEngine;
  private providers: Map<string, ISearchProvider> = new Map();

  private constructor() {
    this.registerProvider(new ProductSearchProvider());
  }

  public static getInstance(): SearchEngine {
    if (!SearchEngine.instance) {
      SearchEngine.instance = new SearchEngine();
    }
    return SearchEngine.instance;
  }

  public registerProvider(provider: ISearchProvider): void {
    this.providers.set(provider.entity.toUpperCase(), provider);
  }

  public async execute(request: SearchRequest): Promise<SearchResult> {
    const entityKey = (request.entity || 'PRODUCT').toUpperCase();
    const provider = this.providers.get(entityKey);

    if (!provider) {
      throw new Error(`Proveedor de búsqueda no disponible para la entidad '${request.entity}'`);
    }

    return provider.search(request);
  }
}
