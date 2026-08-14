export function calculatePriceWithMarginAndIVA(costoStr: string, margin: number, ivaRate = 0.05) {
  const costNum = parseFloat(costoStr);
  if (!isNaN(costNum) && costNum > 0) {
    const base = costNum * (1 + margin);
    const iva = base * ivaRate;
    const total = (base + iva).toFixed(2);
    const ivaStr = iva.toFixed(2);
    return {
      precioTotal: total,
      ivaAmount: ivaStr,
    };
  }
  return {
    precioTotal: '',
    ivaAmount: '0.00',
  };
}
