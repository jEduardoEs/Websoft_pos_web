import { SearchRequest } from './SearchRequest';
import { SearchResult } from './SearchResult';

export interface ISearchProvider<T = any> {
  entity: string;
  search(request: SearchRequest): Promise<SearchResult<T>>;
}
