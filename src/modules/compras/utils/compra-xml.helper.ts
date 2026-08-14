import { removeAccents, matchesSearchQuery } from '@/lib/search-utils';

export interface ParsedXmlItem {
  productoId: string;
  nombre: string;
  cantidad: string;
  precioUnitario: string;
  subtotal: number;
  _xmlNombre: string;
  _xmlCodigo: string;
}

export interface ParsedXmlResult {
  nitEmisor: string;
  nombreEmisor: string;
  numAutorizacion: string;
  serie: string;
  fechaEmision: string;
  total: string;
  items: ParsedXmlItem[];
  matchedCount: number;
}

export function findBestInventoryMatch(xmlName: string, xmlCode: string, productos: any[]) {
  if (!productos || productos.length === 0) return null;

  const normXmlName = removeAccents(xmlName || '').toLowerCase().trim();
  const normXmlCode = removeAccents(xmlCode || '').toLowerCase().trim();

  // 1. Match by SKU / Codigo exact or normalized
  if (normXmlCode) {
    const matchCode = productos.find(p => {
      if (!p.codigo) return false;
      const pCode = removeAccents(p.codigo).toLowerCase().trim();
      return pCode === normXmlCode || pCode.includes(normXmlCode) || normXmlCode.includes(pCode);
    });
    if (matchCode) return matchCode;
  }

  // 2. Match by exact normalized name
  if (normXmlName) {
    const matchExactName = productos.find(p => {
      if (!p.nombre) return false;
      const pName = removeAccents(p.nombre).toLowerCase().trim();
      return pName === normXmlName;
    });
    if (matchExactName) return matchExactName;

    // 3. Match using accent-tolerant matchesSearchQuery
    const matchQuery = productos.find(p => {
      if (!p.nombre) return false;
      const pFull = `${p.codigo || ''} ${p.nombre} ${p.descripcion || ''}`;
      return matchesSearchQuery(pFull, xmlName) || matchesSearchQuery(xmlName, p.nombre);
    });
    if (matchQuery) return matchQuery;

    // 4. Token overlap matching (>= 50% keyword match)
    const xmlTokens = normXmlName.split(/[\s,.\-\/]+/).filter(t => t.length >= 3);
    if (xmlTokens.length > 0) {
      let bestMatch: any = null;
      let highestRatio = 0;

      for (const p of productos) {
        if (!p.nombre) continue;
        const pFull = removeAccents(`${p.codigo || ''} ${p.nombre} ${p.descripcion || ''}`).toLowerCase();
        const matchedTokens = xmlTokens.filter(tok => pFull.includes(tok)).length;
        const ratio = matchedTokens / xmlTokens.length;
        if (ratio >= 0.5 && ratio > highestRatio) {
          highestRatio = ratio;
          bestMatch = p;
        }
      }
      if (bestMatch) return bestMatch;
    }
  }

  return null;
}

export async function parseCompraXML(file: File, productos: any[]): Promise<ParsedXmlResult> {
  const text = await file.text();
  const parser = new DOMParser();
  const xml = parser.parseFromString(text, 'application/xml');

  const getByLocal = (localName: string): Element | null => {
    const all = xml.getElementsByTagName('*');
    for (let i = 0; i < all.length; i++) {
      if (all[i].localName === localName) return all[i];
    }
    return null;
  };

  const getAllByLocal = (localName: string): Element[] => {
    const all = xml.getElementsByTagName('*');
    const result: Element[] = [];
    for (let i = 0; i < all.length; i++) {
      if (all[i].localName === localName) result.push(all[i]);
    }
    return result;
  };

  const getAttrEl = (el: Element | null, attr: string) => el?.getAttribute(attr) || '';

  const emisorEl = getByLocal('Emisor');
  const nitEmisor = getAttrEl(emisorEl, 'NITEmisor');
  const nombreEmisor = getAttrEl(emisorEl, 'NombreComercial') || getAttrEl(emisorEl, 'NombreEmisor');

  const numAutEl = getByLocal('NumeroAutorizacion');
  const numAutorizacion = numAutEl?.textContent?.trim() || '';
  const serie = getAttrEl(numAutEl, 'Serie');

  const datosEl = getByLocal('DatosGenerales');
  const fechaEmision = getAttrEl(datosEl, 'FechaHoraEmision')?.slice(0, 10) || '';
  const granTotal = getByLocal('GranTotal')?.textContent?.trim() || '';

  const itemEls = getAllByLocal('Item');
  const rawItems: { desc: string; cantidad: number; precioUnitario: number; codigo: string }[] = [];

  for (const itemEl of itemEls) {
    const getItemLocal = (ln: string) => {
      const all = itemEl.getElementsByTagName('*');
      for (let i = 0; i < all.length; i++) {
        if (all[i].localName === ln) return all[i].textContent?.trim() || '';
      }
      return '';
    };

    const desc = getItemLocal('Descripcion');
    const cantidad = +(getItemLocal('Cantidad') || '1');
    const precioUnitarioVal = +(getItemLocal('PrecioUnitario') || '0');
    const precioVal = +(getItemLocal('Precio') || '0');
    const montoVal = +(getItemLocal('Monto') || '0');
    const codigo = getItemLocal('Codigo') || getItemLocal('CodigoItem') || '';

    const costoUnit = precioUnitarioVal > 0 
      ? precioUnitarioVal 
      : precioVal > 0 
        ? precioVal / cantidad 
        : montoVal > 0 
          ? montoVal / cantidad 
          : 0;

    if (desc) {
      rawItems.push({
        desc,
        cantidad,
        precioUnitario: costoUnit,
        codigo,
      });
    }
  }

  let matchedCount = 0;
  const items: ParsedXmlItem[] = rawItems.map(ri => {
    const match = findBestInventoryMatch(ri.desc, ri.codigo, productos);
    if (match) matchedCount++;
    return {
      productoId: match ? String(match.id) : '',
      nombre: match ? match.nombre : ri.desc,
      cantidad: String(ri.cantidad),
      precioUnitario: ri.precioUnitario.toFixed(2),
      subtotal: ri.cantidad * ri.precioUnitario,
      _xmlNombre: ri.desc,
      _xmlCodigo: ri.codigo || '',
    };
  });

  return {
    nitEmisor,
    nombreEmisor,
    numAutorizacion,
    serie,
    fechaEmision,
    total: granTotal,
    items,
    matchedCount,
  };
}
