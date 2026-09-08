/**
 * Dinheiro. Centavos (inteiro) é a única representação persistida.
 * Nenhum float entra no banco, e nenhuma string de preço é montada à mão.
 */

/** 15990 → "R$ 159,90" */
export function formatCents(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  });
}

/** "159,90" | "159.90" | 159.9 → 15990. Lança se não for um valor válido. */
export function parseToCents(input: string | number): number {
  if (typeof input === 'number') {
    if (!Number.isFinite(input) || input < 0) throw new Error('valor inválido');
    return Math.round(input * 100);
  }
  const normalized = input.trim().replace(/\s|R\$/g, '').replace(/\./g, '').replace(',', '.');
  const n = Number(normalized);
  if (!Number.isFinite(n) || n < 0) throw new Error('valor inválido');
  return Math.round(n * 100);
}

/** Percentual de desconto arredondado, ou null quando não há promoção. */
export function discountPercent(priceCents: number, compareAtCents: number | null): number | null {
  if (!compareAtCents || compareAtCents <= priceCents) return null;
  return Math.round(((compareAtCents - priceCents) / compareAtCents) * 100);
}

/**
 * Preço no Pix. Espelha exatamente a função pix_price_cents() do banco:
 * não acumula com preço promocional, e arredonda meio para cima nos centavos.
 */
export function pixPriceCents(
  priceCents: number,
  compareAtCents: number | null,
  discount: number,
): number | null {
  if (compareAtCents !== null && compareAtCents !== undefined) return null;
  if (!discount || discount <= 0) return null;
  return Math.round(priceCents * (1 - discount / 100));
}
