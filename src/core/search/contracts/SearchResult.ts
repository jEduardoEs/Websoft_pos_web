export interface SearchHit<T = any> {
  id: string | number;
  entity: string;
  score: number;
  item: T;
  matchedFields?: string[];
}

export interface SearchResult<T = any> {
  query: string;
  total: number;
  limit: number;
  offset: number;
  executionTimeMs: number;
  hits: SearchHit<T>[];
}
