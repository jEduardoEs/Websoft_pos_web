import { removeAccents } from '@/lib/search-utils';

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
  numeroFactura: string;
  serie: string;
  fechaEmision: string;
  total: string;
  items: ParsedXmlItem[];
  matchedCount: number;
}

/**
 * Extrae codigos contenidos en corchetes [CODIGO] en la descripcion del XML
 */
export function extractCodeAndCleanDesc(rawDesc: string, xmlCode = ''): { primaryCode: string; extraCodes: string[]; cleanDesc: string } {
  let desc = rawDesc.trim();
  const extraCodes: string[] = [];
  let primaryCode = xmlCode.trim();

  const bracketMatch = desc.match(/^\[([^\]]+)\]/);
  if (bracketMatch) {
    const rawBracket = bracketMatch[1].trim();
    const parts = rawBracket.split(/[\s|,\/]+/).map(s => s.trim()).filter(Boolean);
    if (parts.length > 0) {
      if (!primaryCode) primaryCode = parts[0];
      extraCodes.push(...parts);
    }
  }

  if (xmlCode) {
    extraCodes.push(xmlCode.trim());
  }

  return { primaryCode, extraCodes: Array.from(new Set(extraCodes)), cleanDesc: desc };
}

/**
 * Algoritmo inteligente de vinculacion que evita falsos positivos.
 */
export function findBestInventoryMatch(rawXmlName: string, xmlCode: string, productos: any[]) {
  if (!productos || productos.length === 0) return null;

  const { extraCodes, cleanDesc } = extractCodeAndCleanDesc(rawXmlName, xmlCode);
  const normXmlName = removeAccents(cleanDesc || rawXmlName || '').toLowerCase().trim();

  // 1. Coincidencia por SKU / Codigo exacto o entre corchetes
  if (extraCodes.length > 0) {
    for (const code of extraCodes) {
      if (!code || code.length < 2) continue;
      const normCode = removeAccents(code).toLowerCase().trim();

      const matchCode = productos.find(p => {
        if (!p.codigo && !p.nombre) return false;
        const pCode = removeAccents(p.codigo || '').toLowerCase().trim();
        const pName = removeAccents(p.nombre || '').toLowerCase().trim();

        if (pCode && (pCode === normCode || pCode.includes(`[${normCode}]`) || pCode === normCode)) return true;
        if (pName.includes(`[${normCode}]`)) return true;
        return false;
      });

      if (matchCode) return matchCode;
    }
  }

  // 2. Coincidencia por nombre exacto
  if (normXmlName) {
    const matchExactName = productos.find(p => {
      if (!p.nombre) return false;
      const pName = removeAccents(p.nombre).toLowerCase().trim();
      return pName === normXmlName;
    });
    if (matchExactName) return matchExactName;
  }

  // 3. Coincidencia estricta por tokens con verificacion de numeros (evita emparejar COMBO 2 con COMBO 4 u 8)
  if (normXmlName) {
    const xmlTokens = normXmlName.split(/[\s,.\-\/\(\)\[\]]+/).filter(t => t.length >= 2 || /^\d+$/.test(t));
    const xmlNumbers = xmlTokens.filter(t => /^\d+$/.test(t) || /^\d+(mp|gb|tb|k|m)$/i.test(t));

    let bestMatch: any = null;
    let highestRatio = 0;

    for (const p of productos) {
      if (!p.nombre) continue;
      const pFull = removeAccents(`${p.codigo || ''} ${p.nombre} ${p.descripcion || ''}`).toLowerCase();
      const pTokens = pFull.split(/[\s,.\-\/\(\)\[\]]+/).filter(t => t.length >= 2 || /^\d+$/.test(t));
      const pNumbers = pTokens.filter(t => /^\d+$/.test(t) || /^\d+(mp|gb|tb|k|m)$/i.test(t));

      // Verificacion de conflicto de numeros (si el XML dice 2 camaras, no vincular a producto con 4 o 8 camaras)
      let numberConflict = false;
      for (const num of xmlNumbers) {
        if (/^\d+$/.test(num)) {
          const numInt = parseInt(num);
          if (!pTokens.includes(num)) {
            const pInts = pNumbers.filter(n => /^\d+$/.test(n)).map(n => parseInt(n));
            if (pInts.length > 0 && !pInts.includes(numInt)) {
              numberConflict = true;
              break;
            }
          }
        } else if (!pFull.includes(num)) {
          numberConflict = true;
          break;
        }
      }

      if (numberConflict) continue;

      const matchedTokens = xmlTokens.filter(tok => pTokens.includes(tok) || pFull.includes(tok)).length;
      const ratio = matchedTokens / xmlTokens.length;

      // Requiere alta coincidencia (>= 85%)
      if (ratio >= 0.85 && ratio > highestRatio) {
        highestRatio = ratio;
        bestMatch = p;
      }
    }

    if (bestMatch) return bestMatch;
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
  const numAutorizacion = numAutEl?.textContent?.trim() || getAttrEl(numAutEl, 'Numero') || '';
  const numeroFactura = getAttrEl(numAutEl, 'Numero') || getAttrEl(getByLocal('DatosGenerales'), 'Numero') || numAutorizacion;
  const serie = getAttrEl(numAutEl, 'Serie') || getAttrEl(getByLocal('DatosGenerales'), 'Serie') || '';

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
    const descuentoVal = +(getItemLocal('Descuento') || '0');
    const totalVal = +(getItemLocal('Total') || '0');
    const montoVal = +(getItemLocal('Monto') || '0');
    const codigo = getItemLocal('Codigo') || getItemLocal('CodigoItem') || '';

    const netLineTotal = totalVal > 0 
      ? totalVal 
      : (precioVal > 0 ? Math.max(0, precioVal - descuentoVal) : (montoVal > 0 ? Math.max(0, montoVal - descuentoVal) : 0));
    
    const costoUnit = netLineTotal > 0
      ? netLineTotal / cantidad
      : (precioUnitarioVal > 0 ? Math.max(0, precioUnitarioVal - (descuentoVal / cantidad)) : 0);

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
    numeroFactura,
    serie,
    fechaEmision,
    total: granTotal,
    items,
    matchedCount,
  };
}
