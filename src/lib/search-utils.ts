// src/lib/search-utils.ts

/**
 * Removes tildes and accents from a string (e.g., "Cámara" -> "Camara")
 */
export function removeAccents(str: string): string {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Generates search variants for a token (e.g. "camara" -> ["camara", "cámara"])
 */
export function getSearchVariants(token: string): string[] {
  if (!token) return [];
  const norm = removeAccents(token).toLowerCase();
  const raw = token.toLowerCase();
  const set = new Set<string>([raw, norm]);

  // Common Spanish accent placements
  const a1 = norm.replace(/a(?=[^a]*$)/, 'á');
  const a2 = norm.replace(/e(?=[^e]*$)/, 'é');
  const a3 = norm.replace(/i(?=[^i]*$)/, 'í');
  const a4 = norm.replace(/o(?=[^o]*$)/, 'ó');
  const a5 = norm.replace(/u(?=[^u]*$)/, 'ú');
  [a1, a2, a3, a4, a5].forEach(v => set.add(v));

  return Array.from(set);
}

/**
 * Checks if target text contains all tokens in searchQuery, ignoring accents and case.
 */
export function matchesSearchQuery(targetText: string, searchQuery: string): boolean {
  if (!searchQuery || !searchQuery.trim()) return true;
  if (!targetText) return false;

  const normTarget = removeAccents(targetText).toLowerCase();
  const tokens = searchQuery.trim().split(/\s+/).filter(Boolean);

  return tokens.every(token => {
    const normToken = removeAccents(token).toLowerCase();
    return normTarget.includes(normToken);
  });
}

/**
 * Builds Prisma `where` clause for multi-word, accent-tolerant searching across specified fields.
 */
export function buildSearchWhereClause(searchQuery: string, fields: string[]) {
  if (!searchQuery || !searchQuery.trim() || fields.length === 0) return {};

  const tokens = searchQuery.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return {};

  const andConditions = tokens.map(token => {
    const variants = getSearchVariants(token);
    const orConditions = variants.flatMap(variant =>
      fields.map(field => ({
        [field]: { contains: variant, mode: 'insensitive' as const }
      }))
    );
    return { OR: orConditions };
  });

  return { AND: andConditions };
}

/**
 * Ranks and filters search results by relevance to the search query.
 */
export function rankSearchResults<T>(
  items: T[],
  searchQuery: string,
  getFieldString: (item: T) => string,
  getCodeField?: (item: T) => string | null | undefined
): T[] {
  if (!searchQuery || !searchQuery.trim()) return items;

  const rawQuery = searchQuery.trim().toLowerCase();
  const normQuery = removeAccents(rawQuery);

  // Filter items that match all tokens
  const filtered = items.filter(item => {
    const fullText = getFieldString(item);
    return matchesSearchQuery(fullText, searchQuery);
  });

  // Sort filtered items by relevance
  return filtered.sort((a, b) => {
    const codeA = getCodeField ? removeAccents(getCodeField(a) || '').toLowerCase() : '';
    const codeB = getCodeField ? removeAccents(getCodeField(b) || '').toLowerCase() : '';
    const textA = removeAccents(getFieldString(a)).toLowerCase();
    const textB = removeAccents(getFieldString(b)).toLowerCase();

    // 1. Exact match on code
    if (codeA === normQuery && codeB !== normQuery) return -1;
    if (codeB === normQuery && codeA !== normQuery) return 1;

    // 2. Code starts with query
    if (codeA.startsWith(normQuery) && !codeB.startsWith(normQuery)) return -1;
    if (codeB.startsWith(normQuery) && !codeA.startsWith(normQuery)) return 1;

    // 3. Text/Name starts with query
    if (textA.startsWith(normQuery) && !textB.startsWith(normQuery)) return -1;
    if (textB.startsWith(normQuery) && !textA.startsWith(normQuery)) return 1;

    return 0;
  });
}
