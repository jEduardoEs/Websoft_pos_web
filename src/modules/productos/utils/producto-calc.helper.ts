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

export function calculateNewPricePreservingMargin(oldCost: number, oldPrice: number, newWeightedCost: number, defaultMargin = 0.20): number {
  if (newWeightedCost <= 0) return oldPrice;
  if (oldCost > 0 && oldPrice > oldCost) {
    const ratio = oldPrice / oldCost;
    return Number((newWeightedCost * ratio).toFixed(2));
  }
  const base = newWeightedCost * (1 + defaultMargin);
  const total = base * 1.05;
  return Number(total.toFixed(2));
}
