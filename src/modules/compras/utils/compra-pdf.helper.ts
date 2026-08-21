import { removeAccents } from '@/lib/search-utils';

export interface ParsedPdfResult {
  nitEmisor?: string;
  nombreEmisor?: string;
  serie?: string;
  numeroFactura?: string;
  numAutorizacion?: string;
  fechaEmision?: string;
  total?: string;
  textExtracted?: string;
}

/**
 * Extrae texto visible y metadatos de facturas PDF (Guatemala FEL / SAT / Infile / Megaprint)
 * incluso si los datos estan comprimidos con FlateDecode.
 */
export async function parseCompraPDF(file: File): Promise<ParsedPdfResult> {
  try {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    let binaryStr = '';
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binaryStr += String.fromCharCode.apply(null, Array.from(chunk));
    }

    const textTokens: string[] = [];

    // Buscar stream / endstream y descomprimir FlateDecode si esta disponible en el navegador
    const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
    let match: RegExpExecArray | null;

    while ((match = streamRegex.exec(binaryStr)) !== null) {
      const rawStream = match[1];
      const streamBuf = new Uint8Array(rawStream.length);
      for (let i = 0; i < rawStream.length; i++) {
        streamBuf[i] = rawStream.charCodeAt(i) & 0xff;
      }

      let decompressedText = '';
      try {
        // Intentar usar DecompressionStream native de navegadores web modernos
        if (typeof DecompressionStream !== 'undefined') {
          const ds = new DecompressionStream('deflate');
          const writer = ds.writable.getWriter();
          writer.write(streamBuf);
          writer.close();
          const response = new Response(ds.readable);
          const decompBuf = await response.arrayBuffer();
          const decBytes = new Uint8Array(decompBuf);
          decompressedText = String.fromCharCode.apply(null, Array.from(decBytes));
        }
      } catch (err) {
        /* Fallback si el stream no esta comprimido o falla */
      }

      if (decompressedText) {
        const tjMatches = decompressedText.match(/\(([^()]*)\)\s*Tj/g) || [];
        for (const tj of tjMatches) {
          const inner = tj.replace(/^\(|\)\s*Tj$/g, '').trim();
          if (inner) textTokens.push(inner);
        }
        const arrayTjMatches = decompressedText.match(/\[([\s\S]*?)\]\s*TJ/g) || [];
        for (const atj of arrayTjMatches) {
          const parens = atj.match(/\(([^()]*)\)/g) || [];
          const word = parens.map(p => p.slice(1, -1)).join('');
          if (word) textTokens.push(word);
        }
      }
    }

    // Fallback: extraer paren matches directos del string binario
    const parenMatches = binaryStr.match(/\(([^()]{2,100})\)/g) || [];
    for (const m of parenMatches) {
      const clean = m.slice(1, -1).replace(/\\([()\\])/g, '$1').trim();
      if (clean.length > 1) textTokens.push(clean);
    }

    const fullStr = textTokens.join(' ') + ' ' + binaryStr;

    // 1. Extraer UUID / NumeroAutorizacion
    const uuidTok = textTokens.find(t => /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i.test(t));
    const uuidMatch = fullStr.match(/([0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12})/i);
    const numAutorizacion = uuidTok || (uuidMatch ? uuidMatch[1] : '');

    // 2. Extraer NIT Emisor vs NIT Cliente
    let nitEmisor = '';
    for (let i = 0; i < textTokens.length; i++) {
      const tok = textTokens[i];
      if (/^NIT\s*:?/i.test(tok)) {
        const nextTok = (textTokens[i + 1] || '').trim();
        const inlineNit = tok.replace(/^NIT\s*:?/i, '').trim();
        const val = nextTok && /^[0-9]{5,10}[-─]?[0-9kK]?$/.test(nextTok) ? nextTok : inlineNit;

        const isBeforeCliente = !textTokens.slice(0, i).some(t => /DATOS DEL CLIENTE/i.test(t));
        if (val && !nitEmisor && isBeforeCliente) {
          nitEmisor = val;
        }
      }
    }

    if (!nitEmisor) {
      const nitMatch = fullStr.match(/NIT\s*(?:Emisor|Proveedor)?\s*[:.-]?\s*([0-9]{5,10}[-─]?[0-9kK])/i);
      if (nitMatch) nitEmisor = nitMatch[1];
    }

    // 3. Extraer Serie (Serie: XXXX o token previo a UUID)
    let serie = '';
    const serieIdx = textTokens.findIndex(t => /^Serie\s*:?/i.test(t));
    if (serieIdx !== -1 && textTokens[serieIdx + 1] && /^[A-Z0-9]{4,12}$/i.test(textTokens[serieIdx + 1])) {
      serie = textTokens[serieIdx + 1].trim();
    }
    if (!serie && numAutorizacion) {
      serie = numAutorizacion.split('-')[0];
    }

    // 4. Extraer Numero Factura
    let numeroFactura = '';
    const noIdx = textTokens.findIndex(t => /^No\.\s*:?/i.test(t) || /^N[uU]mero\s*:?/i.test(t));
    if (noIdx !== -1 && textTokens[noIdx + 1] && /^[0-9]{4,14}$/.test(textTokens[noIdx + 1])) {
      numeroFactura = textTokens[noIdx + 1].trim();
    }
    if (!numeroFactura) {
      const numMatch = fullStr.match(/No\.\s*:?\s*([0-9]{4,14})/i) || fullStr.match(/N[uU]mero\s*:?\s*([0-9]{4,14})/i);
      if (numMatch) numeroFactura = numMatch[1];
    }

    // 5. Extraer Fecha (YYYY-MM-DD o DD/MM/YYYY)
    let fechaEmision = '';
    const fechaIso = fullStr.match(/([0-9]{4}-[0-9]{2}-[0-9]{2})/);
    if (fechaIso) {
      fechaEmision = fechaIso[1];
    } else {
      const fechaGt = fullStr.match(/([0-9]{2}\/[0-9]{2}\/[0-9]{4})/);
      if (fechaGt) {
        const parts = fechaGt[1].split('/');
        fechaEmision = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }

    // 6. Extraer Total
    let total = '';
    const qMatch = textTokens.find(t => /^Q\s*[0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?/.test(t));
    if (qMatch) {
      total = qMatch.replace(/^Q\s*/, '').replace(/,/g, '').trim();
    }

    return {
      nitEmisor,
      serie,
      numeroFactura,
      numAutorizacion,
      fechaEmision,
      total,
      textExtracted: fullStr.slice(0, 500)
    };
  } catch (err) {
    console.warn('Advertencia al analizar el PDF:', err);
    return {};
  }
}
